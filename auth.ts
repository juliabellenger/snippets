import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveTokens } from "@/lib/googleTokens";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/snippets/api/auth",
  trustHost: true,
  debug: true,
  providers: [
    Google({
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
