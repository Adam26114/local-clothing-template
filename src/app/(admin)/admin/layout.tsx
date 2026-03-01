import { redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

import { AppSidebar } from '@/components/admin/app-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/auth/login?next=/admin');
  }

  if (session.role !== 'admin') {
    redirect('/account');
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      <AppSidebar userEmail={session.email} variant="inset" />
      <SidebarInset>
        <AdminTopbar userEmail={session.email} />
        <main className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
