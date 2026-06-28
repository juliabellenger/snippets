import { auth } from "@/auth";
import { getValidAccessToken } from "@/lib/googleTokens";

/**
 * Resolves a valid Google access token for the current session, or null if
 * there isn't one (not signed in, or tokens not yet captured/refreshable).
 */
export async function getSessionAccessToken(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  return getValidAccessToken(email);
}
