'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/(admin)/admin/categories/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { normalizeSlug } from '@/lib/utils/slug';
import { normalizeSortOrder } from '@/lib/data/validation';
import type { Category } from '@/lib/types';

type CategoryEditorProps = {
  mode: 'create' | 'edit';
  categoryId?: string;
  initialCategory?: Category;
  categories: Category[];
};

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
};

function collectDescendantIds(categories: Category[], rootId: string) {
  const descendants = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const children = categories.filter((item) => item.parentId === current);
    for (const child of children) {
      if (descendants.has(child._id)) continue;
      descendants.add(child._id);
      queue.push(child._id);
    }
  }

  return descendants;
}

export function CategoryEditor({ mode, categoryId, initialCategory, categories }: CategoryEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sourceCategory = useMemo(() => {
    if (mode === 'edit' && initialCategory) {
      return initialCategory;
    }
    return undefined;
  }, [initialCategory, mode]);

  const [form, setForm] = useState<CategoryFormState>(() => {
    if (sourceCategory) {
      return {
        name: sourceCategory.name,
        slug: sourceCategory.slug,
        description: sourceCategory.description ?? '',
        parentId: sourceCategory.parentId ?? '',
        sortOrder: sourceCategory.sortOrder,
        isActive: sourceCategory.isActive,
      };
    }

    return {
      name: '',
      slug: '',
      description: '',
      parentId: '',
      sortOrder: 0,
      isActive: true,
    };
  });

  const autoSlug = useMemo(() => {
    const base = form.name.trim() || form.slug.trim() || 'category';
    return normalizeSlug(base);
  }, [form.name, form.slug]);

  const availableParentOptions = useMemo(() => {
    if (mode !== 'edit' || !sourceCategory) {
      return categories;
    }

    const descendants = collectDescendantIds(categories, sourceCategory._id);
    return categories.filter((item) => item._id !== sourceCategory._id && !descendants.has(item._id));
  }, [categories, mode, sourceCategory]);

  const saveCategory = () => {
    if (!form.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        slug: autoSlug,
        description: form.description.trim() || undefined,
        parentId: form.parentId || undefined,
        sortOrder: normalizeSortOrder(form.sortOrder),
        isActive: form.isActive,
      };

      const result =
        mode === 'create'
          ? await createCategoryAction(payload)
          : await updateCategoryAction(categoryId ?? sourceCategory?._id ?? '', payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === 'create' ? 'Category created.' : 'Category updated.');

      if (mode === 'create') {
        router.push('/admin/categories');
        return;
      } else {
        setForm({
          name: result.data.name,
          slug: result.data.slug,
          description: result.data.description ?? '',
          parentId: result.data.parentId ?? '',
          sortOrder: result.data.sortOrder,
          isActive: result.data.isActive,
        });
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. MEN"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={autoSlug} readOnly className="bg-muted/40 text-muted-foreground" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Parent Category</Label>
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">No parent (top-level)</option>
            {availableParentOptions.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
                {category.isActive ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setForm((prev) => ({
                ...prev,
                sortOrder: normalizeSortOrder(parsed),
              }));
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={4}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Optional short description for this category"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
        />
        Active
      </label>

      <div className="flex justify-end gap-2">
        <Button className="bg-black text-white hover:bg-zinc-800" disabled={isPending} onClick={saveCategory}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Create Category' : 'Update Category'}
        </Button>
      </div>
    </div>
  );
}
