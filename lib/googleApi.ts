import { auth } from "@/auth";

export async function getSessionAccessToken(): Promise<string | null> {
  const session = await auth() as ({ accessToken?: string; error?: string } & Awaited<ReturnType<typeof auth>>) | null;
  if (!session?.user?.email) return null;
  if (session.error === "RefreshTokenError") return null;
  return session.accessToken ?? null;
}
