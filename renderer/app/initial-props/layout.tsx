import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title:
    'List Example (as Function Component) | Next.js + TypeScript + Electron Example',
};

export default function InitialPropsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
