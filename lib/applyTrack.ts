/** Countries shown on /apply. CN eligibility is US + CA only. */
export const COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "MX", label: "Mexico" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "IE", label: "Ireland" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "PT", label: "Portugal" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "PL", label: "Poland" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colombia" },
  { code: "PE", label: "Peru" },
  { code: "PH", label: "Philippines" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "MY", label: "Malaysia" },
  { code: "SG", label: "Singapore" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "TW", label: "Taiwan" },
  { code: "HK", label: "Hong Kong" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "ZA", label: "South Africa" },
  { code: "NG", label: "Nigeria" },
  { code: "EG", label: "Egypt" },
  { code: "OTHER", label: "Other / not listed" },
] as const;

export type CountryCode = (typeof COUNTRY_OPTIONS)[number]["code"];

export const COUNTRY_CODES = COUNTRY_OPTIONS.map((c) => c.code) as [
  CountryCode,
  ...CountryCode[],
];

const CN_ELIGIBLE = new Set<string>(["US", "CA"]);

/** Forge Creator Network (TikTok CN) is only available in the US and Canada. */
export function isCnEligibleCountry(country: string): boolean {
  return CN_ELIGIBLE.has(country);
}

export function countryLabel(code: string | undefined | null): string {
  if (!code) return "—";
  return COUNTRY_OPTIONS.find((c) => c.code === code)?.label ?? code;
}

/**
 * Pathway:
 * - CN: no agency AND country is US or Canada
 * - MN (Media Network): has an agency, OR outside US/Canada
 */
export function resolveApplyTrack(input: {
  country: string;
  hasAgency: boolean;
}): { track: "CN" | "MN"; mnReason: "agency" | "country" | null } {
  if (!input.hasAgency && isCnEligibleCountry(input.country)) {
    return { track: "CN", mnReason: null };
  }
  if (!isCnEligibleCountry(input.country)) {
    return { track: "MN", mnReason: "country" };
  }
  return { track: "MN", mnReason: "agency" };
}
