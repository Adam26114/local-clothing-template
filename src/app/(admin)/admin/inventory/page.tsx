import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { InventoryTable } from '@/components/admin/inventory-table';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminInventoryPage() {
  const { repositories, selection } = getServerDataRepositories();
  const rows = await repositories.inventory.listFlattened();

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-zinc-600">Monitor stock levels by product, color variant, and size.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <InventoryTable initialRows={rows} />
    </div>
  );
}
