'use client';

import Link from 'next/link';
import { toast } from 'sonner';

import { useCart } from '@/components/store/cart-context';
import { formatMmk } from '@/lib/currency';
import { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variant = product.colorVariants[0];
  const size = variant.selectedSizes[0] ?? 'M';

  const handleQuickAdd = () => {
    addItem({
      productId: product._id,
      colorVariantId: variant.id,
      size,
      quantity: 1,
    });
    toast.success('Added to cart');
  };

  return (
    <article className="group rounded-sm border bg-white">
      <Link href={`/products/${product.slug}`} className="block aspect-[3/4] bg-zinc-100" />
      <div className="space-y-2 p-4">
        <Link href={`/products/${product.slug}`} className="line-clamp-1 text-sm font-medium">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {product.salePrice ? (
            <>
              <span className="font-semibold">{formatMmk(product.salePrice)}</span>
              <span className="text-zinc-400 line-through">
                {formatMmk(product.basePrice ?? 0)}
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatMmk(product.basePrice ?? 0)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Quick Add
        </button>
      </div>
    </article>
  );
}
