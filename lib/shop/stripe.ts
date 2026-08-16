import "server-only";

import Stripe from "stripe";
import { randomBytes } from "crypto";
import { getOrCreateShopSettings } from "@/lib/shop/settings";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function shopWebhookUrl(): string {
  return `${appUrl()}/api/shop/stripe/webhook`;
}

export function checkoutIntegrationId(): string {
  return `hubshop_${randomBytes(4).toString("hex")}`;
}

export type ShopStripeConfig = {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  hasSecret: boolean;
  hasWebhook: boolean;
  secretSource: "settings" | "env" | null;
  webhookSource: "settings" | "env" | null;
};

export async function getShopStripeConfig(): Promise<ShopStripeConfig> {
  const settings = await getOrCreateShopSettings();
  const settingsSecret = settings.stripeSecretKey?.trim() || "";
  const envSecret = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const settingsWebhook = settings.stripeWebhookSecret?.trim() || "";
  const envWebhook = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  const publishableKey =
    settings.stripePublishableKey?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    "";

  const secretKey = settingsSecret || envSecret;
  const webhookSecret = settingsWebhook || envWebhook;

  return {
    secretKey,
    webhookSecret,
    publishableKey,
    hasSecret: !!secretKey,
    hasWebhook: !!webhookSecret,
    secretSource: settingsSecret ? "settings" : envSecret ? "env" : null,
    webhookSource: settingsWebhook ? "settings" : envWebhook ? "env" : null,
  };
}

export async function isStripeConfigured(): Promise<boolean> {
  const config = await getShopStripeConfig();
  return config.hasSecret;
}

export async function getStripe(): Promise<Stripe> {
  const config = await getShopStripeConfig();
  if (!config.secretKey) {
    throw new Error("Stripe is not configured. Add a secret key in Shop settings.");
  }
  return new Stripe(config.secretKey);
}

export function parseShippingCountries(raw: string | null | undefined): string[] {
  const codes = (raw || "US,CA,GB,AU")
    .split(/[\s,]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return codes.length > 0 ? Array.from(new Set(codes)) : ["US"];
}
