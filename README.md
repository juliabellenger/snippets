This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Google Sign-In Setup

The app is protected behind Google sign-in (see [proxy.ts](proxy.ts) and [auth.ts](auth.ts)).

1. In the [Google Cloud Console](https://console.cloud.google.com) for the `juliabellenger` project, go to **APIs & Services → Credentials → Create Credentials → OAuth client ID** (type: Web application).
   - Authorized redirect URI: `https://juliabellenger.com/snippets/api/auth/callback/google`
   - (For local dev, also add `http://localhost:3000/snippets/api/auth/callback/google`)
2. Copy the generated Client ID and Client Secret.
3. Create a local `.env` (see `.env.example`) with:
   - `AUTH_SECRET` — generate with `npx auth secret` or `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from step 2
   - `ALLOWED_EMAILS` — comma-separated list of Google accounts allowed to log in (leave blank to allow any Google account)
4. For Cloud Run, store `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in [Secret Manager](https://console.cloud.google.com/security/secret-manager) under those exact names, and add an `ALLOWED_EMAILS` GitHub Actions secret — the deploy workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) wires them into the Cloud Run service.

### Dashboard (Calendar / Gmail / Tasks)

The home page (`app/page.tsx`) pulls live data from Google, which needs extra setup beyond basic sign-in:

1. In the GCP project, enable the **Google Calendar API**, **Gmail API**, and **Google Tasks API** (APIs & Services → Library).
2. On the **OAuth consent screen**, add these scopes: `calendar.readonly`, `gmail.readonly`, `tasks`.
3. Set the consent screen's publishing status to **In production** (not "Testing") — otherwise Google expires the refresh token after 7 days and you'll be forced to re-login weekly. Since this app isn't public, you'll see an "unverified app" warning during consent — click through it (Advanced → Go to app).
4. If you signed in before this change, sign out and back in once so the new scopes are actually granted — old sessions won't have them.
5. Google OAuth tokens are cached server-side in `data/google-tokens.json` (gitignored — never commit it). Like `data/snippets.json`, this lives on the Cloud Run container's ephemeral disk, so a redeploy clears it and requires one more re-login.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
