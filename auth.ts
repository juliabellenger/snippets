import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveTokens } from "@/lib/googleTokens";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
    async signIn({ user, account }) {
      const isAllowed =
        allowedEmails.length === 0 ||
        allowedEmails.includes((user.email ?? "").toLowerCase());
      if (!isAllowed) return false;

      if (account?.access_token && user.email) {
        saveTokens(user.email, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        });
      }
      return true;
    },
  },
  pages: {
    signIn: "/snippets/login",
  },
});
