"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hubHas } from "@/lib/hub/modules";
import { getOrCreateShopSettings } from "@/lib/shop/settings";
import {
  appUrl,
  checkoutIntegrationId,
  getStripe,
  isStripeConfigured,
  parseShippingCountries,
} from "@/lib/shop/stripe";

export async function startShopCheckout(formData: FormData) {
  if (!hubHas("shop")) {
    throw new Error("Shop is not available");
  }
  const { user } = await requireProfile();
  if (!(await isStripeConfigured())) {
    throw new Error("Checkout is not configured yet");
  }

  const settings = await getOrCreateShopSettings();
  if (!settings.isPublished) {
    throw new Error("The shop is not published");
  }

  const variantId = String(formData.get("variantId") || "");
  const quantity = Math.max(1, Math.min(20, Number(formData.get("quantity") || 1) || 1));
  if (!variantId) throw new Error("Choose an option");

  const variant = await prisma.shopVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        include: { files: { select: { id: true } } },
      },
    },
  });
  if (!variant || variant.product.status !== "ACTIVE") {
    throw new Error("That product is not available");
  }
  if (variant.inventory !== null && variant.inventory < quantity) {
    throw new Error("Not enough inventory");
  }
  if (variant.product.kind === "DIGITAL" && variant.product.files.length === 0) {
    throw new Error("This download is not ready yet");
  }

  const subtotalCents = variant.priceCents * quantity;
  const stripe = await getStripe();

  let customerId = (
    await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, email: true, name: true },
    })
  );

  if (!customerId?.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: customerId?.email || user.email || undefined,
      name: customerId?.name || user.name || undefined,
      metadata: { hubUserId: user.id },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    customerId = { ...customerId!, stripeCustomerId: customer.id };
  }

  const order = await prisma.shopOrder.create({
    data: {
      userId: user.id,
      status: "PENDING",
      currency: settings.currency,
      subtotalCents,
      totalCents: subtotalCents,
      items: {
        create: {
          productId: variant.productId,
          variantId: variant.id,
          title: variant.product.title,
          variantTitle: variant.title,
          quantity,
          unitPriceCents: variant.priceCents,
        },
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId.stripeCustomerId!,
    client_reference_id: order.id,
    integration_identifier: checkoutIntegrationId(),
    line_items: [
      {
        quantity,
        price_data: {
          currency: settings.currency,
          unit_amount: variant.priceCents,
          product_data: {
            name:
              variant.title && variant.title !== "Default"
                ? `${variant.product.title} — ${variant.title}`
                : variant.product.title,
          },
        },
      },
    ],
    metadata: { orderId: order.id, userId: user.id },
    success_url: `${appUrl()}/shop/orders?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/shop/${variant.product.slug}`,
    ...(variant.product.kind === "PHYSICAL"
      ? {
          shipping_address_collection: {
            allowed_countries: parseShippingCountries(settings.shippingCountries) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
          },
        }
      : {}),
  });

  if (!session.url) {
    throw new Error("Could not start checkout");
  }

  await prisma.shopOrder.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  redirect(session.url);
}

export async function syncPaidCheckout(sessionId: string) {
  if (!hubHas("shop") || !(await isStripeConfigured()) || !sessionId) return;
  const { user } = await requireProfile();
  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== user.id) return;
  const { fulfillCheckoutSession } = await import("@/lib/shop/fulfill");
  await fulfillCheckoutSession(session);
}
