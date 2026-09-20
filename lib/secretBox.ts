import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

function secretKey() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required to store Resend keys.");
  }
  return scryptSync(secret, "triforge-resend-byok", 32);
}

/** Pack a secret as v1.iv.tag.ciphertext (base64url). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(packed: string): string {
  const parts = packed.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unknown secret encoding.");
  }
  const [, ivB, tagB, dataB] = parts;
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64url")), decipher.final()]).toString(
    "utf8"
  );
}
