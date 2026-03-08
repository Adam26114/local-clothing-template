import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { ProductEditor } from '@/components/admin/product-editor';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function NewProductPage() {
  const { repositories, selection } = getServerDataRepositories();
  const categories = await repositories.categories.list({ activeOnly: true });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <p className="text-sm text-zinc-600">Create a new item with variants, stock, and pricing.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <ProductEditor mode="create" categories={categories} />
    </div>
  );
}
