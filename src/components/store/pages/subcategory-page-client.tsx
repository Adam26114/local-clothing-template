'use client';

import { ProductCard } from '@/components/store/product-card';
import type { Product } from '@/lib/types';

export function SubCategoryPageClient({
  category,
  subcategory,
  initialProducts,
}: {
  category: string;
  subcategory: string;
  initialProducts: Product[];
}) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold uppercase">
        {category} / {subcategory}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
