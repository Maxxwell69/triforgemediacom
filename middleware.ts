import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { hostnameFromHeaders, resolveHubHost } from "@/lib/hub/host";

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

function clientHubGate(req: NextRequest & { auth?: { user?: unknown } | null }) {
  const resolved = resolveHubHost(hostnameFromHeaders(req.headers));
  if (resolved.kind !== "client") return null;

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
    if (req.auth && (pathname === "/" || pathname === "/signin" || pathname === "/login")) {
      return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
    }
    const url = req.nextUrl.clone();
    url.pathname = `/hub-host/${resolved.slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (!req.auth) {
    const loginUrl = new URL("/signin", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

export default auth((req) => {
  const gated = clientHubGate(req);
  if (gated) return gated;

  const { pathname } = req.nextUrl;
  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  if (isStaffRoute) {
    const role = req.auth?.user?.role;
    if (!req.auth) {
      const loginUrl = new URL("/signin", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith("/superadmin")) {
      if (role !== "ADMIN") {
        const dest = role === "MOD" ? "/admin" : "/home";
        return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
      }
    } else {
      const isAllowed = role === "ADMIN" || role === "MOD";
      if (!isAllowed) {
        const loginUrl = new URL("/signin", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
