'use client';

import Link from 'next/link';
import { Search, ShoppingBag, User } from 'lucide-react';

import { NAV_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/store/cart-context';

export function StoreHeader() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <div className="hidden flex-1 items-center gap-6 md:flex">
          {NAV_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/${category.toLowerCase()}`}
              className="text-sm font-medium tracking-[0.08em] text-black hover:opacity-70"
            >
              {category}
            </Link>
          ))}
        </div>

        <Link href="/" className="text-2xl font-bold tracking-[0.2em] text-black">
          KHIT
        </Link>

        <div className="flex flex-1 items-center justify-end gap-4">
          <button type="button" className={cn('rounded p-1 text-black hover:bg-zinc-100')}>
            <Search className="size-4" />
          </button>
          <Link href="/auth/login" className={cn('rounded p-1 text-black hover:bg-zinc-100')}>
            <User className="size-4" />
          </Link>
          <Link href="/cart" className="relative rounded p-1 text-black hover:bg-zinc-100">
            <ShoppingBag className="size-4" />
            {totalItems > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-black px-1 text-center text-[10px] leading-4 text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
