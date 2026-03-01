'use client';

import { useMemo, useState } from 'react';

import { ProductCard } from '@/components/store/product-card';
import { Input } from '@/components/ui/input';
import type { Product } from '@/lib/types';

export function CategoryPageClient({
  category,
  initialProducts,
}: {
  category: string;
  initialProducts: Product[];
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'new' | 'priceLow' | 'sale'>('new');
  const [limit, setLimit] = useState(6);

  const products = useMemo(() => {
    let result = initialProducts.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    if (sort === 'priceLow') {
      result = [...result].sort(
        (a, b) => (a.salePrice ?? a.basePrice ?? 0) - (b.salePrice ?? b.basePrice ?? 0)
      );
    }

    if (sort === 'sale') {
      result = result.filter((item) => (item.salePrice ?? 0) > 0);
    }

    return result;
  }, [initialProducts, query, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold uppercase">{category}</h1>
        <p className="text-sm text-zinc-600">{products.length} products</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by product name"
        />
        <select
          className="rounded border px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value as 'new' | 'priceLow' | 'sale')}
        >
          <option value="new">Sort: New</option>
          <option value="priceLow">Sort: Price Low-High</option>
          <option value="sale">Sort: Sale</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, limit).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {limit < products.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((prev) => prev + 6)}
            className="rounded border px-4 py-2 text-sm"
          >
            Load More
          </button>
        </div>
      ) : null}
    </div>
  );
}
