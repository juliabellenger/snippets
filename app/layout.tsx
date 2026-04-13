import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snippets",
  description: "Capture and organize short snippets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Cormorant+SC:wght@400;500;600;700&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-slate antialiased">
        <div className="mx-auto max-w-lg min-h-screen">{children}</div>
      </body>
    </html>
  );
}
