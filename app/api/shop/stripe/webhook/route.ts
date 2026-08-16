import { NextResponse } from "next/server";
import { getShopStripeConfig, getStripe } from "@/lib/shop/stripe";
import { fulfillCheckoutSession, markCheckoutFailed } from "@/lib/shop/fulfill";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const config = await getShopStripeConfig();
  if (!config.webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = await getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, config.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckoutSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await markCheckoutFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Shop Stripe webhook failed:", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
