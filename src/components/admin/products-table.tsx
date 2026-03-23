'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  duplicateProductAction,
  softDeleteProductAction,
  toggleBulkProductStatusAction,
} from '@/app/(admin)/admin/products/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatMmk } from '@/lib/currency';
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

function productDisplayPrice(product: Product): number {
  return product.salePrice ?? product.basePrice ?? 0;
}

function getProductThumbnailUrl(product: Product): string | undefined {
  for (const variant of product.colorVariants) {
    const firstImage = variant.images.find((image) => image.trim().length > 0);
    if (firstImage) {
      return firstImage;
    }
  }

  return undefined;
}

export function ProductsTable({ initialProducts, categories }: ProductsTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Product[]>(initialProducts);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under25' | '25to50' | '50to100' | '100plus'>(
    'all'
  );
  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const categoryOptions = useMemo(() => {
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories]);

  const statusOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: 'all', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    []
  );

  const priceOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: 'all', label: 'All Prices' },
      { value: 'under25', label: `Under ${formatMmk(25000)}` },
      { value: '25to50', label: `${formatMmk(25000)} - ${formatMmk(50000)}` },
      { value: '50to100', label: `${formatMmk(50000)} - ${formatMmk(100000)}` },
      { value: '100plus', label: '100,000+ ks' },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    return rows.filter((product) => {
      const activeMatch =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? product.isPublished : !product.isPublished);
      const categoryMatch = categoryFilter === 'all' || product.categoryId === categoryFilter;
      const price = productDisplayPrice(product);
      const priceMatch =
        priceFilter === 'all' ||
        (priceFilter === 'under25' && price < 25000) ||
        (priceFilter === '25to50' && price >= 25000 && price < 50000) ||
        (priceFilter === '50to100' && price >= 50000 && price < 100000) ||
        (priceFilter === '100plus' && price >= 100000);
      return activeMatch && categoryMatch && priceMatch;
    });
  }, [activeFilter, categoryFilter, priceFilter, rows]);

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
      enableSorting: false,
      cell: ({ row }) => {
        const thumbnailUrl = getProductThumbnailUrl(row.original);

        if (!thumbnailUrl) {
          return <div className="size-12 rounded-md bg-zinc-100" />;
        }

        return (
          <img
            src={thumbnailUrl}
            alt={row.original.name}
            className="size-12 rounded-md object-cover"
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
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
      accessorFn: (row) => categoryMap.get(row.categoryId) ?? 'Unknown',
      cell: ({ row }) => categoryMap.get(row.original.categoryId) ?? 'Unknown',
    },
    {
      accessorKey: 'basePrice',
      header: 'Price',
      cell: ({ row }) => formatMmk(productDisplayPrice(row.original)),
    },
    {
      id: 'stockTotal',
      header: 'Stock',
      accessorFn: (row) => totalStock(row),
      cell: ({ row }) => totalStock(row.original),
    },
    {
      id: 'active',
      header: 'Status',
      accessorFn: (row) => (row.isPublished ? 'Active' : 'Inactive'),
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
          {row.original.isPublished ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'rowMenu',
      header: () => null,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end pr-1">
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push('/admin/products/new')}>
                <Plus className="size-4" />
                <span>Create</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/products/${row.original._id}/edit`)}>
                <Pencil className="size-4" />
                <span>Update</span>
              </DropdownMenuItem>
              <DropdownMenuItem
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
                <Copy className="size-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
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
                <Trash2 className="size-4" />
                <span>Soft Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminDataTable
        tableId="products"
        columns={withRowSelection(columns)}
        data={filteredRows}
        searchPlaceholder="Search products..."
        onSelectedRowsChange={setSelectedProducts}
        enableRowDrag
        getRowId={(row) => row._id}
        showAddButton={false}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Combobox
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}
              options={statusOptions}
              placeholder="All Status"
              searchPlaceholder="Search"
              showChevron={false}
            />

            <Combobox
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categoryOptions.map((category) => ({
                  value: category._id,
                  label: category.name,
                })),
              ]}
              placeholder="All Categories"
              searchPlaceholder="Search"
              showChevron={false}
            />

            <Combobox
              value={priceFilter}
              onValueChange={(value) => setPriceFilter(value as typeof priceFilter)}
              options={priceOptions}
              placeholder="All Prices"
              searchPlaceholder="Search"
              showChevron={false}
            />

            {selectedIds.length > 0 ? (
              <div className="ml-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => bulkSetPublished(true)}
                >
                  Activate Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => bulkSetPublished(false)}
                >
                  Deactivate Selected
                </Button>
              </div>
            ) : null}

            {isPending ? (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" /> Saving...
              </span>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
