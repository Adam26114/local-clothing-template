'use client';

import type * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCategory2,
  IconDashboard,
  IconDatabase,
  IconHelp,
  IconInnerShadowTop,
  IconPackageExport,
  IconReport,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';

import { NavDocuments } from '@/components/admin/nav-documents';
import { NavMain } from '@/components/admin/nav-main';
import { NavSecondary } from '@/components/admin/nav-secondary';
import { NavUser } from '@/components/admin/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function AppSidebar({
  userEmail,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userEmail?: string;
}) {
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: IconDashboard,
      isActive: pathname === '/admin',
    },
    {
      title: 'Orders',
      url: '/admin/orders',
      icon: IconShoppingBag,
      isActive: pathname.startsWith('/admin/orders'),
    },
    {
      title: 'Products',
      url: '/admin/products',
      icon: IconPackageExport,
      isActive: pathname.startsWith('/admin/products'),
    },
    {
      title: 'Categories',
      url: '/admin/categories',
      icon: IconCategory2,
      isActive: pathname.startsWith('/admin/categories'),
    },
    {
      title: 'Inventory',
      url: '/admin/inventory',
      icon: IconDatabase,
      isActive: pathname.startsWith('/admin/inventory'),
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: IconUsers,
      isActive: pathname.startsWith('/admin/users'),
    },
  ];

  const documents = [
    {
      name: 'Data Library',
      url: '/admin/products',
      icon: IconDatabase,
    },
    {
      name: 'Reports',
      url: '/admin/orders',
      icon: IconReport,
    },
    {
      name: 'Word Assistant',
      url: '/admin/users',
      icon: IconUser,
    },
  ];

  const navSecondary = [
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: IconSettings,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Khit Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: 'KHIT',
            email: userEmail ?? 'admin@khit.mm',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
