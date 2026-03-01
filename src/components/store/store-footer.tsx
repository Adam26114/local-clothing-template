import Link from 'next/link';

import { BRAND } from '@/lib/constants';

export function StoreFooter() {
  return (
    <footer className="mt-20 border-t bg-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-[0.08em]">KHIT</h3>
          <p className="text-sm text-zinc-600">Myanmar local brand shirt e-commerce platform.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-[0.08em]">Pickup</h3>
          <p className="text-sm text-zinc-600">{BRAND.pickupAddress}</p>
          <p className="text-sm text-zinc-600">{BRAND.pickupHours}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-[0.08em]">Contact</h3>
          <p className="text-sm text-zinc-600">{BRAND.contactEmail}</p>
          <p className="text-sm text-zinc-600">{BRAND.contactPhone}</p>
          <div className="mt-3 flex gap-3 text-sm text-zinc-600">
            <Link href="https://instagram.com/khit.mm" target="_blank">
              Instagram
            </Link>
            <Link href="https://facebook.com/khit.mm" target="_blank">
              Facebook
            </Link>
            <Link href="https://tiktok.com/@khit.mm" target="_blank">
              TikTok
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
