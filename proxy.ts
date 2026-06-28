import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth"];

// Deliberately avoid wrapping with next-auth's `auth()` helper here: it runs
// the full session-check machinery and reconstructs the NextResponse.next()
// signal via `new Response(...)`, which doesn't reliably preserve the
// original request's Cookie header on to the next stage. A direct,
// lightweight token check (the "optimistic check" pattern Next.js docs
// recommend for Proxy) avoids that reconstruction entirely.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.includes(p));
  if (isPublic) return;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: true,
  });

  if (!token) {
    const loginUrl = new URL("/snippets/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
