import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { SubCategoryPageClient } from '@/components/store/pages/subcategory-page-client';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const products = await repositories.products.listBySubcategorySlugs(category, subcategory);

  return (
    <div className="space-y-6">
      <DataSourceNotice selection={selection} />
      <SubCategoryPageClient
        category={category}
        subcategory={subcategory}
        initialProducts={products}
      />
    </div>
  );
}
