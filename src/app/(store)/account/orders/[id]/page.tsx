import { notFound } from 'next/navigation';

import { formatMmk } from '@/lib/currency';
import { orders } from '@/lib/mock-data';

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = orders.find((item) => item._id === id);
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-4 rounded border p-6">
      <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
      <p className="text-sm text-zinc-600">Status: {order.status}</p>
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="rounded border p-3 text-sm">
            <p>{item.name}</p>
            <p className="text-zinc-600">
              {item.color} · {item.size} · qty {item.quantity}
            </p>
          </div>
        ))}
      </div>
      <p className="font-semibold">Total: {formatMmk(order.total)}</p>
    </div>
  );
}
