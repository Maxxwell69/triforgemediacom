import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { hostnameFromHeaders, resolveHubHost } from "@/lib/hub/host";

const { auth } = NextAuth(authConfig);

function clientHubGate(req: NextRequest) {
  const resolved = resolveHubHost(hostnameFromHeaders(req.headers));
  if (resolved.kind !== "client") return null;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next")) return null;
  if (pathname === "/api/health" || pathname.startsWith("/api/health/")) return null;
  if (pathname.startsWith("/hub-host/")) return null;

  // Never expose Hub 0 APIs (auth, cron, booking, chat) on a client hostname.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = req.nextUrl.clone();
  url.pathname = `/hub-host/${resolved.slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
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
      return;
    }
    const isAllowed = role === "ADMIN" || role === "MOD";
    if (!isAllowed) {
      const loginUrl = new URL("/signin", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
