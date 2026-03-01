import { notFound } from 'next/navigation';

import { OrderDetailPageClient } from '@/components/admin/pages/order-detail-page-client';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const order = await repositories.orders.getById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Order Detail</h1>
        <p className="text-sm text-zinc-600">Review line items and customer delivery details.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <OrderDetailPageClient order={order} />
    </div>
  );
}
