import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import StyledComponentsRegistry from '@/lib/styled-registry';

const SITE_URL = 'https://www.snapforgeui.com';
const TITLE = 'SnapForge UI — your component vault, one call away';
const DESCRIPTION =
  'Save any React or HTML component to your own library, preview it live, export it, and hand it to your AI agent over MCP.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — SnapForge UI',
  },
  description: DESCRIPTION,
  applicationName: 'SnapForge UI',
  keywords: [
    'component vault',
    'React components',
    'HTML components',
    'MCP server',
    'AI agents',
    'shadcn',
    'component library',
    'live preview',
    'Sandpack',
  ],
  authors: [{ name: 'SnapForge UI' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'SnapForge UI',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
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
