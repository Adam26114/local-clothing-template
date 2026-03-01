'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { logoutAction } from '@/app/(store)/auth/actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const routeTitleMap: Array<{ match: RegExp; label: string }> = [
  { match: /^\/admin$/, label: 'Dashboard' },
  { match: /^\/admin\/orders/, label: 'Orders' },
  { match: /^\/admin\/products/, label: 'Products' },
  { match: /^\/admin\/inventory/, label: 'Inventory' },
  { match: /^\/admin\/users/, label: 'Users' },
  { match: /^\/admin\/settings/, label: 'Settings' },
];

function titleFromPath(pathname: string): string {
  return routeTitleMap.find((entry) => entry.match.test(pathname))?.label ?? 'Admin';
}

export function AdminTopbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <p className="hidden rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground md:block">
            {userEmail ?? 'admin@khit.mm'}
          </p>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link href="https://github.com" target="_blank" rel="noreferrer" className="dark:text-foreground">
              GitHub
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
