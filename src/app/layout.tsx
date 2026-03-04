import type { Metadata } from 'next';

import { AppProviders } from '@/components/providers/app-providers';
import { RootShell } from '@/components/shared/root-shell';

import './globals.css';

export const metadata: Metadata = {
  title: 'Khit Myanmar E-Commerce',
  description: 'Khit local brand shirt platform inspired by Mango.',
};

/**
 * Application root layout that defines the top-level HTML structure, enables language and hydration settings, applies global body styling, and wraps page content with providers and the app shell.
 *
 * @param children - Page content to render inside the app shell.
 * @returns The top-level HTML element tree used as the application's layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>
          <RootShell>{children}</RootShell>
        </AppProviders>
      </body>
    </html>
  );
}
