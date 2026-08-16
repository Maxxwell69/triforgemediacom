import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function fulfillPaidOrder(orderId: string, paymentIntentId?: string | null) {
  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, kind: true } },
          variant: { select: { id: true, inventory: true } },
        },
      },
    },
  });
  if (!order) return;
  if (order.status === "PAID" || order.status === "FULFILLING" || order.status === "FULFILLED") {
    return;
  }
  if (order.status === "CANCELLED" || order.status === "REFUNDED") return;

  const hasPhysical = order.items.some((item) => item.product.kind === "PHYSICAL");
  const digitalProductIds = Array.from(
    new Set(order.items.filter((item) => item.product.kind === "DIGITAL").map((item) => item.product.id))
  );

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.variant.inventory !== null) {
        await tx.shopVariant.update({
          where: { id: item.variant.id },
          data: { inventory: { decrement: item.quantity } },
        });
      }
    }

    for (const productId of digitalProductIds) {
      await tx.shopDownloadGrant.upsert({
        where: {
          userId_productId_orderId: {
            userId: order.userId,
            productId,
            orderId: order.id,
          },
        },
        create: { userId: order.userId, productId, orderId: order.id },
        update: {},
      });
    }

    await tx.shopOrder.update({
      where: { id: order.id },
      data: {
        status: hasPhysical ? "FULFILLING" : "FULFILLED",
        stripePaymentIntentId: paymentIntentId || order.stripePaymentIntentId,
      },
    });
  });
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  if (session.payment_status === "unpaid") {
    await prisma.shopOrder.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return;
  }

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const shipping = session.collected_information?.shipping_details;

  await prisma.shopOrder.updateMany({
    where: { id: orderId, stripeCheckoutSessionId: session.id },
    data: {
      stripePaymentIntentId: paymentIntent,
      shippingName: shipping?.name ?? undefined,
      shippingLine1: shipping?.address?.line1 ?? undefined,
      shippingLine2: shipping?.address?.line2 ?? undefined,
      shippingCity: shipping?.address?.city ?? undefined,
      shippingRegion: shipping?.address?.state ?? undefined,
      shippingPostal: shipping?.address?.postal_code ?? undefined,
      shippingCountry: shipping?.address?.country ?? undefined,
    },
  });

  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    await fulfillPaidOrder(orderId, paymentIntent);
  }
}

export async function markCheckoutFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await prisma.shopOrder.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
