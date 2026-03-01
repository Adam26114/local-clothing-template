import { OrdersTable } from '@/components/admin/orders-table';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminOrdersPage() {
  const { repositories, selection } = getServerDataRepositories();
  const orders = await repositories.orders.list();

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-zinc-600">Track status, totals, and delivery mode for each order.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <OrdersTable initialOrders={orders} />
    </div>
  );
}
