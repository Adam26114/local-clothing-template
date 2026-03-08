import { CategoriesTable } from '@/components/admin/categories-table';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminCategoriesPage() {
  const { repositories, selection } = getServerDataRepositories();
  const categories = await repositories.categories.list({ activeOnly: false });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-zinc-600">
          Manage parent and child categories used across storefront navigation and filtering.
        </p>
      </div>
      <DataSourceNotice selection={selection} />
      <CategoriesTable initialCategories={categories} />
    </div>
  );
}
