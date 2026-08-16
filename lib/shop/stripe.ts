import "server-only";

import Stripe from "stripe";
import { randomBytes } from "crypto";

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return new Stripe(key);
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function checkoutIntegrationId(): string {
  return `hubshop_${randomBytes(4).toString("hex")}`;
}
