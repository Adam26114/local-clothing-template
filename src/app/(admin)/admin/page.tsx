import { DashboardKpis } from '@/components/admin/dashboard-kpis';
import { OrdersTable } from '@/components/admin/orders-table';
import { RevenueChartCard } from '@/components/admin/revenue-chart-card';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminDashboardPage() {
  const { repositories, selection } = getServerDataRepositories();
  const [kpis, orders, series90d, series30d, series7d] = await Promise.all([
    repositories.dashboard.getKpis(),
    repositories.orders.list(),
    repositories.dashboard.getRevenueSeries('90d'),
    repositories.dashboard.getRevenueSeries('30d'),
    repositories.dashboard.getRevenueSeries('7d'),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <DataSourceNotice selection={selection} />
          </div>
          <DashboardKpis kpis={kpis} />
          <div className="px-4 lg:px-6">
            <RevenueChartCard
              seriesByRange={{
                '90d': series90d,
                '30d': series30d,
                '7d': series7d,
              }}
            />
          </div>
          <section>
            <OrdersTable initialOrders={orders} showStatusFilter={false} />
          </section>
        </div>
      </div>
    </div>
  );
}
