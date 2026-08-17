import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// A second, edge-safe NextAuth instance (no Prisma adapter/bcrypt) so the
// middleware bundle stays free of Node.js-only dependencies.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  if (isStaffRoute) {
    const role = req.auth?.user?.role;
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
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
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/superadmin/:path*"],
};
