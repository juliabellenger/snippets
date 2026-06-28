"use client";

import { SessionProvider, signIn } from "next-auth/react";

function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/snippets" })}
      className="rounded-lg border-[1.5px] border-gold bg-cream-light px-6 py-3 font-heading text-sm tracking-wider text-slate hover:bg-gold-faint transition-colors"
    >
      Sign in with Google
    </button>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider basePath="/snippets/api/auth">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-4xl tracking-[0.15em] text-slate">
          Snippets
        </h1>
        <p className="font-script text-2xl text-gold mt-1">
          life at a glance
        </p>
        <div className="mt-4 mb-10 w-48 border-t border-gold/40" />
        <SignInButton />
      </div>
    </SessionProvider>
  );
}
