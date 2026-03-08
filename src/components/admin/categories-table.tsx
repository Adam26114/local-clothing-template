'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  deactivateCategoryAction,
  reactivateCategoryAction,
} from '@/app/(admin)/admin/categories/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';

type CategoriesTableProps = {
  initialCategories: Category[];
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

export function CategoriesTable({ initialCategories }: CategoriesTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>(initialCategories);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'parent' | 'child'>('all');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();

  const parentMap = useMemo(() => {
    return new Map(rows.map((category) => [category._id, category.name]));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((category) => {
      const statusMatch =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? category.isActive : !category.isActive);

      const levelMatch =
        levelFilter === 'all' ||
        (levelFilter === 'parent' ? !category.parentId : Boolean(category.parentId));

      return statusMatch && levelMatch;
    });
  }, [activeFilter, levelFilter, rows]);

  const deactivateCategory = (id: string) => {
    startTransition(async () => {
      const result = await deactivateCategoryAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRows((prev) => {
        const descendants = collectDescendantIds(prev, id);
        const ids = new Set<string>([id, ...descendants]);
        const now = Date.now();

        return prev.map((category) =>
          ids.has(category._id)
            ? {
                ...category,
                isActive: false,
                updatedAt: now,
              }
            : category
        );
      });

      toast.success('Category deactivated.');
    });
  };

  const reactivateCategory = (id: string) => {
    startTransition(async () => {
      const result = await reactivateCategoryAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRows((prev) =>
        prev.map((category) =>
          category._id === id
            ? {
                ...category,
                isActive: true,
                updatedAt: Date.now(),
              }
            : category
        )
      );

      toast.success('Category reactivated.');
    });
  };

  const columns: Array<ColumnDef<Category>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link href={`/admin/categories/${row.original._id}/edit`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      id: 'parent',
      header: 'Parent',
      cell: ({ row }) => (row.original.parentId ? parentMap.get(row.original.parentId) ?? '-' : '—'),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Sort',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/categories/${row.original._id}/edit`}>Edit</Link>
          </Button>
          {row.original.isActive ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => deactivateCategory(row.original._id)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => reactivateCategory(row.original._id)}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded border bg-white px-3 py-1 text-sm"
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="rounded border bg-white px-3 py-1 text-sm"
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value as 'all' | 'parent' | 'child')}
        >
          <option value="all">All Levels</option>
          <option value="parent">Parent Categories</option>
          <option value="child">Child Categories</option>
        </select>

        {isPending ? (
          <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" /> Saving...
          </span>
        ) : null}
      </div>

      <AdminDataTable
        tableId="categories"
        columns={withRowSelection(columns)}
        data={filteredRows}
        searchPlaceholder="Search by name, slug, or parent"
        onSelectedRowsChange={setSelectedCategories}
        addButtonLabel="Add Category"
        onAddClick={() => router.push('/admin/categories/new')}
        toolbar={
          selectedCategories.length > 0 ? (
            <span className="text-sm text-zinc-600">{selectedCategories.length} selected</span>
          ) : null
        }
      />
    </div>
  );
}
