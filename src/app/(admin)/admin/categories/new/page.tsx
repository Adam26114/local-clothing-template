import { CategoryEditor } from '@/components/admin/category-editor';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function NewCategoryPage() {
  const { repositories, selection } = getServerDataRepositories();
  const categories = await repositories.categories.list({ activeOnly: false });

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Category</h1>
        <p className="text-sm text-zinc-600">
          Create a new parent or child category for storefront organization.
        </p>
      </div>
      <DataSourceNotice selection={selection} />
      <CategoryEditor mode="create" categories={categories} />
    </div>
  );
}
