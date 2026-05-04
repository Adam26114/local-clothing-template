'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ORDER_STATUSES } from '@/lib/constants';
import { formatMmk } from '@/lib/utils/currency';
import { Order, OrderStatus } from '@/lib/types';

export function OrderDetailPageClient({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status ?? 'pending');

  return (
    <div className="space-y-6 rounded border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-zinc-600">{order.customerInfo.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button variant="outline">Update Status</Button>
          <Button variant="destructive">Cancel Order</Button>
        </div>
      </div>

      <section className="space-y-3">
        {order.items.map((item) => (
          <article key={`${item.productId}-${item.size}`} className="rounded border p-3 text-sm">
            <p className="font-medium">{item.name}</p>
            <p className="text-zinc-600">
              {item.color} · {item.size} · qty {item.quantity}
            </p>
            <p className="font-medium">{formatMmk(item.price * item.quantity)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-2 rounded border p-4 text-sm md:grid-cols-2">
        <p>Delivery: {order.deliveryMethod}</p>
        <p>Payment: Cash on Delivery</p>
        <p>Email: {order.customerInfo.email}</p>
        <p>Phone: {order.customerInfo.phone}</p>
      </section>

      <p className="text-lg font-semibold">Total: {formatMmk(order.total)}</p>
    </div>
  );
}
