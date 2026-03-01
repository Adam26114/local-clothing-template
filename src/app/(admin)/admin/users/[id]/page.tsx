import { notFound } from 'next/navigation';

import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { formatMmk } from '@/lib/currency';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const [user, orders] = await Promise.all([repositories.users.getById(id), repositories.orders.list()]);

  if (!user) {
    notFound();
  }

  const orderHistory = orders.filter((order) => order.customerInfo.email === user.email);
  const totalSpend = orderHistory.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">User Detail</h1>
        <p className="text-sm text-zinc-600">Inspect user profile and purchase history.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <div className="space-y-4 rounded border bg-white p-6">
        <h2 className="text-2xl font-semibold">{user.name}</h2>
        <p className="text-sm text-zinc-600">{user.email}</p>
        <p className="text-sm text-zinc-600">Role: {user.role}</p>
        <p className="text-sm text-zinc-600">Total Spend: {formatMmk(totalSpend)}</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Order History</h2>
          {orderHistory.length === 0 ? (
            <p className="text-sm text-zinc-600">No orders.</p>
          ) : (
            orderHistory.map((order) => (
              <div key={order._id} className="rounded border p-3 text-sm">
                <p>{order.orderNumber}</p>
                <p className="text-zinc-600">{order.status}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
