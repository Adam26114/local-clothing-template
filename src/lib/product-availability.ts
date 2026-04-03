import type { ColorVariant } from '@/lib/types';

type ProductAvailabilityLike = {
  isInStock?: boolean;
  colorVariants: Pick<ColorVariant, 'selectedSizes' | 'stock'>[];
};

export function hasVariantAvailableStock(variant: Pick<ColorVariant, 'selectedSizes' | 'stock'>) {
  return variant.selectedSizes.some((size) => (variant.stock[size] ?? 0) > 0);
}

export function deriveProductInStock(product: ProductAvailabilityLike): boolean {
  if (typeof product.isInStock === 'boolean') {
    return product.isInStock;
  }

  return product.colorVariants.some(hasVariantAvailableStock);
}
