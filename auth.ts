import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: (token.refreshToken as string) ?? "",
    }),
  });
  if (!response.ok) return { ...token, error: "RefreshTokenError" };
  const data = await response.json();
  return {
    ...token,
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    error: undefined,
  };
}

// Firebase Hosting's CDN strips all cookies from requests forwarded to Cloud
// Run except one named exactly `__session` (see
// https://firebase.google.com/docs/hosting/manage-cache). That broke the
// PKCE code_verifier cookie on every OAuth callback. Since we're a
// confidential client (real client secret, not a public/SPA client), PKCE
// isn't required for security here -- disable it so the callback doesn't
// depend on any cookie surviving that GET request. The session cookie still
// needs to survive on every subsequent request, so it's renamed to
// `__session` below.
export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/snippets/api/auth",
  trustHost: true,
  debug: true,
  cookies: {
    sessionToken: {
      name: "__session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    Google({
      checks: [],
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/tasks",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return (
        allowedEmails.length === 0 ||
        allowedEmails.includes((user.email ?? "").toLowerCase())
      );
    },
    async jwt({ token, account }) {
      // First sign-in: persist tokens from the OAuth response into the JWT
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }
      // Token still valid
      const expiresAt = (token.expiresAt as number | undefined) ?? 0;
      if (Date.now() < expiresAt * 1000 - 60_000) return token;
      // Expired — refresh
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Expose the access token and any error to the session so API routes can use it
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        error: token.error as string | undefined,
      };
    },
  },
  pages: {
    signIn: "/snippets/login",
  },
});
