import { redirect } from "next/navigation";

/**
 * Legacy /login — send everyone to the Hub-branded /signin page.
 * Preserves query params (callbackUrl, welcome, reset).
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") params.set(key, value);
      else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/signin?${qs}` : "/signin");
}
