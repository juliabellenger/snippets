import { NextRequest } from "next/server";
import { handlers } from "@/auth";

// Next.js strips the `basePath` (configured as "/snippets" in next.config.ts)
// from `request.url` before it reaches this route handler, but Auth.js needs
// the full external path (matching auth.ts's basePath) to build correct
// sign-in/callback URLs for the OAuth provider. Add the prefix back.
async function withBasePath(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/snippets")) {
    url.pathname = `/snippets${url.pathname}`;
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new NextRequest(url, {
    method: req.method,
    headers: new Headers(req.headers),
    body: hasBody ? await req.blob() : undefined,
    duplex: hasBody ? "half" : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

export async function GET(req: NextRequest) {
  return handlers.GET(await withBasePath(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(await withBasePath(req));
}
