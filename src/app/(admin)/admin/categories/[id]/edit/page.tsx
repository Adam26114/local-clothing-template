import { CategoryEditor } from '@/components/admin/category-editor';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const [category, categories] = await Promise.all([
    repositories.categories.getById(id),
    repositories.categories.list({ activeOnly: false }),
  ]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Category</h1>
        <p className="text-sm text-zinc-600">
          Update hierarchy, status, and storefront metadata for this category.
        </p>
      </div>
      <DataSourceNotice selection={selection} />
      {category ? (
        <CategoryEditor
          mode="edit"
          categoryId={id}
          initialCategory={category}
          categories={categories}
        />
      ) : (
        <p className="text-sm text-zinc-600">Category not found.</p>
      )}
    </div>
  );
}
