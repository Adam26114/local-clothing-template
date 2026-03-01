'use client';

import { usePathname } from 'next/navigation';

import { StoreFooter } from '@/components/store/store-footer';
import { StoreHeader } from '@/components/store/store-header';

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StoreHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      <StoreFooter />
    </div>
  );
}
