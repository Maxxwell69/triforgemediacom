import { prisma } from "@/lib/prisma";
import { COUNTRY_CODES, type CountryCode } from "@/lib/applyTrack";

type ApplyAnswers = {
  phone?: unknown;
  country?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asCountry(value: unknown): CountryCode | null {
  const code = asString(value);
  if (!code) return null;
  return (COUNTRY_CODES as readonly string[]).includes(code) ? (code as CountryCode) : null;
}

/** Pull phone/country from the apply form snapshot when profile fields are empty. */
export async function getApplicationContact(userId: string): Promise<{
  phone: string | null;
  country: CountryCode | null;
}> {
  const application = await prisma.application.findUnique({
    where: { userId },
    select: { answers: true },
  });
  const answers = (application?.answers ?? {}) as ApplyAnswers;
  return {
    phone: asString(answers.phone),
    country: asCountry(answers.country),
  };
}

/**
 * If Profile.phone/country are empty, copy them once from Application.answers
 * so existing members see what they submitted on /apply.
 */
export async function hydrateProfileContactFromApplication(userId: string): Promise<{
  phone: string | null;
  country: string | null;
}> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { phone: true, country: true },
  });
  if (!profile) {
    return { phone: null, country: null };
  }

  if (profile.phone && profile.country) {
    return { phone: profile.phone, country: profile.country };
  }

  const fromApp = await getApplicationContact(userId);
  const phone = profile.phone || fromApp.phone;
  const country = profile.country || fromApp.country;

  if ((!profile.phone && phone) || (!profile.country && country)) {
    await prisma.profile.update({
      where: { userId },
      data: {
        ...(profile.phone ? {} : { phone }),
        ...(profile.country ? {} : { country }),
      },
    });
  }

  return { phone, country };
}
