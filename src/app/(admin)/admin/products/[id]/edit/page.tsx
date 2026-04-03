import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { ProductEditor } from '@/components/admin/product-editor';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const [product, categories] = await Promise.all([
    repositories.products.getById(id),
    repositories.categories.list({ activeOnly: false }),
  ]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <DataSourceNotice selection={selection} />
      {product ? (
        <ProductEditor
          mode="edit"
          productId={id}
          initialProduct={product}
          categories={categories}
        />
      ) : (
        <p className="text-sm text-zinc-600">Product not found.</p>
      )}
    </div>
  );
}
