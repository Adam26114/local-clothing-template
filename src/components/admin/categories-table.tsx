'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  activateCategoryAction,
  deleteCategoryAction,
  deactivateCategoryAction,
  updateCategoryAction,
} from '@/app/(admin)/admin/categories/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { mergeVisibleOrder } from '@/components/admin/category-order';
import { collectCategoryDeleteIds } from '@/lib/category-delete';
import type { Category } from '@/lib/types';

type CategoriesTableProps = {
  initialCategories: Category[];
};

export function CategoriesTable({ initialCategories }: CategoriesTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>(initialCategories);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'parent' | 'child'>('all');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
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

  const setCategoryStatus = (id: string, nextActive: boolean) => {
    startTransition(async () => {
      const result = nextActive
        ? await activateCategoryAction(id)
        : await deactivateCategoryAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRows((prev) => {
        const ids = nextActive ? new Set<string>([id]) : collectCategoryDeleteIds(prev, id);
        const now = Date.now();

        return prev.map((category) =>
          ids.has(category._id)
            ? {
                ...category,
                isActive: nextActive,
                updatedAt: now,
              }
            : category
        );
      });

      toast.success(nextActive ? 'Category activated.' : 'Category deactivated.');
    });
  };

  const confirmDeleteCategory = () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const ids = collectCategoryDeleteIds(rows, target._id);

    startTransition(async () => {
      const result = await deleteCategoryAction(target._id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRows((prev) => prev.filter((category) => !ids.has(category._id)));
      setSelectedCategories((prev) => prev.filter((category) => !ids.has(category._id)));
      setDeleteTarget(null);
      toast.success('Category deleted.');
    });
  };

  const persistRowOrder = (nextRows: Category[]) => {
    const previousRows = rows;
    const mergedRows = mergeVisibleOrder(previousRows, nextRows);
    const nextRowsWithOrder = mergedRows.map((category, index) => ({
      ...category,
      sortOrder: index,
    }));

    setRows(nextRowsWithOrder);

    startTransition(async () => {
      const updates = mergedRows
        .map((category, index) => ({
          category,
          nextSortOrder: index,
          previousSortOrder: previousRows.find((row) => row._id === category._id)?.sortOrder ?? index,
        }))
        .filter(({ previousSortOrder, nextSortOrder }) => previousSortOrder !== nextSortOrder);

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
      enableSorting: false,
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
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => setCategoryStatus(row.original._id, isInactive)}
              >
                {isInactive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  setDeleteTarget(row.original);
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name ?? 'this category'} and all of its
              child categories from the database. This cannot be undone.
              {deleteTarget ? ' If products still use this category tree, deletion will be blocked.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteCategory();
              }}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
