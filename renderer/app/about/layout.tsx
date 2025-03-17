import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title: 'About | Next.js + TypeScript + Electron Example',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
