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
    const isAllowed = role === "ADMIN" || role === "MOD";
    if (!req.auth || !isAllowed) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/superadmin/:path*"],
};
