import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { hostnameFromHeaders, isCustomDomainCandidate, publicOriginFromHeaders, resolveHubHost } from "@/lib/hub/host";

const { auth } = NextAuth(authConfig);

const CLIENT_BLOCKED_PREFIXES = [
  "/superadmin",
  "/apply",
  "/create-a-hub",
  "/updates",
  "/api/apply",
  "/api/cron",
];

function isAuthLanding(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/login" ||
    pathname.startsWith("/signup")
  );
}

/** AUTH_URL makes nextUrl.origin the apex host even on {slug}.hub.… requests. */
function requestOrigin(req: NextRequest) {
  return publicOriginFromHeaders(req.headers) || req.nextUrl.origin;
}

function atOrigin(req: NextRequest, path: string) {
  return new URL(path, `${requestOrigin(req)}/`);
}

async function resolveClientSlug(req: NextRequest): Promise<string | null> {
  const host = hostnameFromHeaders(req.headers);
  const resolved = resolveHubHost(host);
  if (resolved.kind === "client") return resolved.slug;
  if (!isCustomDomainCandidate(host)) return null;
  try {
    const url = new URL("/api/internal/hub-resolve", req.url);
    url.searchParams.set("h", host);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string | null };
    return typeof data.slug === "string" && data.slug ? data.slug : null;
  } catch {
    return null;
  }
}

function clientHubGate(
  req: NextRequest & { auth?: { user?: unknown } | null },
  slug: string | null
) {
  if (!slug) return null;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next")) return null;
  if (pathname === "/api/health" || pathname.startsWith("/api/health/")) return null;
  if (pathname.startsWith("/api/auth")) return null;
  if (pathname.startsWith("/hub-host/")) return null;

  if (CLIENT_BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  if (isAuthLanding(pathname)) {
    if (req.auth && pathname === "/") {
      return NextResponse.redirect(atOrigin(req, "/home"));
    }
    if (pathname === "/login") {
      const url = atOrigin(req, "/signin");
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url);
    }
    const url = atOrigin(req, `/hub-host/${slug}${pathname === "/" ? "" : pathname}`);
    url.search = req.nextUrl.search;
    const headers = new Headers(req.headers);
    headers.set("x-hub-slug", slug);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (!req.auth) {
    const loginUrl = atOrigin(req, "/signin");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

export default auth(async (req) => {
  if (req.nextUrl.pathname.startsWith("/api/internal/hub-resolve")) {
    return NextResponse.next();
  }

  const slug = await resolveClientSlug(req);
  if (!slug && isCustomDomainCandidate(hostnameFromHeaders(req.headers))) {
    if (req.nextUrl.pathname.startsWith("/api/health")) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unknown hub domain" }, { status: 404 });
  }
  const gated = clientHubGate(req, slug);
  if (gated) return gated;

  const { pathname } = req.nextUrl;
  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  if (isStaffRoute) {
    const role = req.auth?.user?.role;
    if (!req.auth) {
      const loginUrl = atOrigin(req, "/signin");
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith("/superadmin")) {
      if (role !== "ADMIN") {
        const dest = role === "MOD" ? "/admin" : "/home";
        return NextResponse.redirect(atOrigin(req, dest));
      }
    } else {
      const isAllowed = role === "ADMIN" || role === "MOD";
      if (!isAllowed) {
        const loginUrl = atOrigin(req, "/signin");
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (slug) requestHeaders.set("x-hub-slug", slug);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
