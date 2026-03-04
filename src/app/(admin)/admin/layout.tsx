import { redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

import { AppSidebar } from '@/components/admin/app-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth/session';

/**
 * Renders the authenticated admin layout with sidebar and topbar and enforces authentication and admin authorization.
 *
 * @param children - Page content to be rendered inside the admin layout.
 * @returns The admin layout element containing a (default-closed) sidebar, an admin topbar, and the provided children. Redirects to the login page if the user is unauthenticated and to the account page if the user is not an admin.
 */
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
      defaultOpen={false}
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
