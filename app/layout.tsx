import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  title: "Snippets",
  description: "Capture and organize short snippets",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Cormorant+SC:wght@400;500;600;700&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-slate antialiased">
        <div className="mx-auto max-w-lg min-h-screen">
          {session?.user && (
            <div className="flex items-center justify-between gap-2 px-4 pt-3 text-xs">
              <nav className="flex gap-3 font-heading tracking-wider text-slate-light/70">
                <Link href="/" className="hover:text-gold">
                  Glance
                </Link>
                <Link href="/capture" className="hover:text-gold">
                  Capture
                </Link>
              </nav>
              <div className="flex items-center gap-2 text-slate-light/70">
                <span>{session.user.email}</span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/snippets/login" });
                  }}
                >
                  <button type="submit" className="underline hover:text-gold">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
          {children}
        </div>
      </body>
    </html>
  );
}
