import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import StyledComponentsRegistry from '@/lib/styled-registry';

export const metadata: Metadata = {
  title: 'SnapForge UI — your component vault, one call away',
  description:
    'Save any React or HTML component to your own library, preview it live, export it, and hand it to your AI agent over MCP.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
