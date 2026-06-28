import { NextRequest } from "next/server";
import { handlers } from "@/auth";

// Next.js strips the `basePath` (configured as "/snippets" in next.config.ts)
// from `request.url` before it reaches this route handler, but Auth.js needs
// the full external path (matching auth.ts's basePath) to build correct
// sign-in/callback URLs for the OAuth provider. Add the prefix back.
function withBasePath(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/snippets")) {
    url.pathname = `/snippets${url.pathname}`;
  }
  return new NextRequest(url, req);
}

export async function GET(req: NextRequest) {
  return handlers.GET(withBasePath(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(withBasePath(req));
}
