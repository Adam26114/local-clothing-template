import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { CategoryPageClient } from '@/components/store/pages/category-page-client';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const products = await repositories.products.listByCategorySlug(category);

  return (
    <div className="space-y-6">
      <DataSourceNotice selection={selection} />
      <CategoryPageClient category={category} initialProducts={products} />
    </div>
  );
}
