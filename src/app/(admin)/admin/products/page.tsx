import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { ProductsTable } from '@/components/admin/products-table';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminProductsPage() {
  const { repositories, selection } = getServerDataRepositories();
  const [products, categories] = await Promise.all([
    repositories.products.list({ publishedOnly: false }),
    repositories.categories.list({ activeOnly: false }),
  ]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-zinc-600">Manage catalog content, variants, and publish status.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <ProductsTable initialProducts={products} categories={categories} />
    </div>
  );
}
