import type { Metadata } from 'next';

import { AppProviders } from '@/components/providers/app-providers';
import { RootShell } from '@/components/shared/root-shell';

import './globals.css';

export const metadata: Metadata = {
  title: 'Khit Myanmar E-Commerce',
  description: 'Khit local brand shirt platform inspired by Mango.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          <RootShell>{children}</RootShell>
        </AppProviders>
      </body>
    </html>
  );
}
