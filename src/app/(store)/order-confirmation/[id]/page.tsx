import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded border bg-white p-8 text-center">
      <p className="text-xs tracking-[0.14em] text-zinc-500">ORDER CONFIRMED</p>
      <h1 className="text-2xl font-semibold">Thank you for your purchase</h1>
      <p className="text-zinc-600">Your order number is {id}.</p>
      <Button asChild className="bg-black text-white hover:bg-zinc-800">
        <Link href="/">Continue Shopping</Link>
      </Button>
    </div>
  );
}
