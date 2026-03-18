'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deactivateCategoryAction, updateCategoryAction } from '@/app/(admin)/admin/categories/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const persistRowOrder = (nextRows: Category[]) => {
    const previousRows = rows;
    setRows(nextRows);

    startTransition(async () => {
      const updates = nextRows
        .map((category, index) => ({ category, nextSortOrder: index }))
        .filter(({ category, nextSortOrder }) => category.sortOrder !== nextSortOrder);

      if (updates.length === 0) return;

      const results = await Promise.all(
        updates.map(({ category, nextSortOrder }) =>
          updateCategoryAction(category._id, {
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
            description: category.description ?? '',
            sortOrder: nextSortOrder,
            isActive: category.isActive,
          })
        )
      );

      const firstError = results.find((result) => !result.ok);
      if (firstError && !firstError.ok) {
        toast.error(firstError.error);
        setRows(previousRows);
        return;
      }

      setRows((prev) =>
        prev.map((category) => {
          const newIndex = nextRows.findIndex((row) => row._id === category._id);
          if (newIndex < 0) return category;
          return { ...category, sortOrder: newIndex };
        })
      );
      toast.success('Category order updated.');
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
      id: 'rowMenu',
      header: () => null,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isInactive = !row.original.isActive;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open row menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => router.push('/admin/categories/new')}>
                <Plus className="size-4" />
                <span>Create</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/categories/${row.original._id}/edit`)}>
                <Pencil className="size-4" />
                <span>Update</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isInactive || isPending}
                onClick={() => {
                  if (isInactive) return;
                  deactivateCategory(row.original._id);
                }}
              >
                <Trash2 className="size-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select
          value={activeFilter}
          onValueChange={(value: 'all' | 'active' | 'inactive') => setActiveFilter(value)}
        >
          <SelectTrigger className="w-[112px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={levelFilter}
          onValueChange={(value: 'all' | 'parent' | 'child') => setLevelFilter(value)}
        >
          <SelectTrigger className="w-[168px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="parent">Parent Categories</SelectItem>
            <SelectItem value="child">Child Categories</SelectItem>
          </SelectContent>
        </Select>

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
        enableRowDrag
        getRowId={(row) => row._id}
        onRowOrderChange={persistRowOrder}
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
