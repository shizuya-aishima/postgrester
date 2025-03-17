import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js + TypeScript + Electron Example",
  description: "Generated by Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div>
          <header>
            <nav>
              <Link href="/">Home</Link> | <Link href="/about">About</Link> |{" "}
              <Link href="/initial-props">With Initial Props</Link>
            </nav>
          </header>
          {children}
          <footer>
            <hr />
            <span>I'm here to stay (Footer)</span>
          </footer>
        </div>
      </body>
    </html>
  );
} 