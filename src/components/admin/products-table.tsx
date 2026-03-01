'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  duplicateProductAction,
  softDeleteProductAction,
  toggleBulkProductStatusAction,
} from '@/app/(admin)/admin/products/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Category, Product } from '@/lib/types';

type ProductsTableProps = {
  initialProducts: Product[];
  categories: Category[];
};

function totalStock(product: Product): number {
  return product.colorVariants.reduce((sum, variant) => {
    return (
      sum + Object.values(variant.stock).reduce((stockSum, value) => stockSum + (value ?? 0), 0)
    );
  }, 0);
}

export function ProductsTable({ initialProducts, categories }: ProductsTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Product[]>(initialProducts);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'notFeatured'>('all');
  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const filteredRows = useMemo(() => {
    return rows.filter((product) => {
      const activeMatch =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? product.isPublished : !product.isPublished);
      const featuredMatch =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' ? product.isFeatured : !product.isFeatured);
      return activeMatch && featuredMatch;
    });
  }, [activeFilter, featuredFilter, rows]);

  const selectedIds = useMemo(
    () => selectedProducts.map((product) => product._id),
    [selectedProducts]
  );

  const bulkSetPublished = (isPublished: boolean) => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one product first.');
      return;
    }

    startTransition(async () => {
      const result = await toggleBulkProductStatusAction(selectedIds, isPublished);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRows((prev) =>
        prev.map((entry) =>
          selectedIds.includes(entry._id)
            ? {
                ...entry,
                isPublished,
                updatedAt: Date.now(),
              }
            : entry
        )
      );

      toast.success(
        `${result.data.updatedCount} product${result.data.updatedCount === 1 ? '' : 's'} updated.`
      );
    });
  };

  const columns: Array<ColumnDef<Product>> = [
    {
      id: 'thumbnail',
      header: 'Thumbnail',
      cell: () => <div className="size-10 rounded bg-zinc-100" />,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={`/admin/products/${row.original._id}/edit`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => row.original.sku ?? '-',
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => categoryMap.get(row.original.categoryId) ?? 'Unknown',
    },
    {
      accessorKey: 'basePrice',
      header: 'Base Price',
      cell: ({ row }) => `Ks ${row.original.basePrice ?? 0}`,
    },
    {
      id: 'stockTotal',
      header: 'Stock Total',
      cell: ({ row }) => totalStock(row.original),
    },
    {
      id: 'active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
          {row.original.isPublished ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/products/${row.original._id}/edit`}>Update</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await duplicateProductAction(row.original._id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }

                setRows((prev) => [result.data, ...prev]);
                toast.success('Product duplicated.');
              });
            }}
          >
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await softDeleteProductAction(row.original._id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }

                setRows((prev) =>
                  prev.map((entry) =>
                    entry._id === row.original._id
                      ? {
                          ...entry,
                          isPublished: false,
                          updatedAt: Date.now(),
                        }
                      : entry
                  )
                );
                toast.success('Product set to inactive.');
              });
            }}
          >
            Soft Delete
          </Button>
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
          value={featuredFilter}
          onChange={(event) =>
            setFeaturedFilter(event.target.value as 'all' | 'featured' | 'notFeatured')
          }
        >
          <option value="all">All Featured</option>
          <option value="featured">Featured</option>
          <option value="notFeatured">Not Featured</option>
        </select>
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" /> Saving...
          </span>
        ) : null}
      </div>

      <AdminDataTable
        tableId="products"
        columns={withRowSelection(columns)}
        data={filteredRows}
        searchPlaceholder="Search by name, SKU, description"
        onSelectedRowsChange={setSelectedProducts}
        enableRowDrag
        getRowId={(row) => row._id}
        addButtonLabel="Add Product"
        onAddClick={() => router.push('/admin/products/new')}
        toolbar={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.length === 0 || isPending}
              onClick={() => bulkSetPublished(true)}
            >
              Activate Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.length === 0 || isPending}
              onClick={() => bulkSetPublished(false)}
            >
              Deactivate Selected
            </Button>
          </div>
        }
      />
    </div>
  );
}
