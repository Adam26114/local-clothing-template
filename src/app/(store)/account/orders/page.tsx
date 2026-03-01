import Link from 'next/link';

import { formatMmk } from '@/lib/currency';
import { getSession } from '@/lib/auth/session';
import { orders } from '@/lib/mock-data';

export default async function AccountOrdersPage() {
  const session = await getSession();
  const customerOrders = orders.filter((order) => order.customerInfo.email === session.email);

  if (!session.isAuthenticated) {
    return <p className="text-sm text-zinc-600">Please log in to view orders.</p>;
  }

  return (
    <div className="space-y-4 rounded border p-6">
      <h1 className="text-2xl font-semibold">Order History</h1>
      {customerOrders.length === 0 ? (
        <p className="text-sm text-zinc-600">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          {customerOrders.map((order) => (
            <Link
              key={order._id}
              href={`/account/orders/${order._id}`}
              className="flex items-center justify-between rounded border p-3 text-sm hover:bg-zinc-50"
            >
              <span>{order.orderNumber}</span>
              <span>{formatMmk(order.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
