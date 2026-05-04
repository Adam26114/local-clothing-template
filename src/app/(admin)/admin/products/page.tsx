import Link from 'next/link';
import { Plus } from 'lucide-react';

import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/admin/products-table';
import { getServerDataRepositories } from '@/lib/data/repositories';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMmk } from '@/lib/utils/currency';
import type { Product } from '@/lib/types';

function getVariantStockTotal(product: Product['colorVariants'][number]): number {
  return Object.values(product.stock).reduce((sum, value) => sum + (value ?? 0), 0);
}

function getLowStockVariantCount(products: Product[]): number {
  return products.reduce(
    (total, product) =>
      total + product.colorVariants.filter((variant) => getVariantStockTotal(variant) <= 5).length,
    0
  );
}

export default async function AdminProductsPage() {
  const { repositories, selection } = getServerDataRepositories();
  const [products, categories, kpis] = await Promise.all([
    repositories.products.list({ publishedOnly: false }),
    repositories.categories.list({ activeOnly: false }),
    repositories.dashboard.getKpis(),
  ]);

  const totalSales = kpis.totalRevenueMmk;
  const publishedProducts = products.filter((product) => product.isPublished).length;
  const featuredProducts = products.filter((product) => product.isFeatured).length;
  const lowStockVariants = getLowStockVariantCount(products);

  return (
    <div className="space-y-6 px-4 pb-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        </div>

        <Button asChild className="bg-black text-white hover:bg-zinc-800">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="space-y-2">{selection ? <DataSourceNotice selection={selection} /> : null}</div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <CardTitle className="text-3xl font-semibold tabular-nums">{formatMmk(totalSales)}</CardTitle>
              </div>
              <CardAction>
                <Badge variant="outline">Revenue</Badge>
              </CardAction>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Published Products</p>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {publishedProducts}
                </CardTitle>
              </div>
              <CardAction>
                <Badge variant="outline">Live</Badge>
              </CardAction>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Featured Products</p>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {featuredProducts}
                </CardTitle>
              </div>
              <CardAction>
                <Badge variant="secondary">Curated</Badge>
              </CardAction>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low Stock Variants</p>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {lowStockVariants}
                </CardTitle>
              </div>
              <CardAction>
                <Badge variant="destructive">Restock</Badge>
              </CardAction>
            </div>
          </CardHeader>
        </Card>
      </section>

      <ProductsTable initialProducts={products} categories={categories} />
    </div>
  );
}
