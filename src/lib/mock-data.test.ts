import { describe, expect, it } from 'vitest';

import { getFeaturedProducts, getProductsByCategory, getProductBySlug } from '@/lib/mock-data';

describe('mock data selectors', () => {
  it('returns product by slug', () => {
    const product = getProductBySlug('relaxed-linen-shirt');
    expect(product?.name).toBe('Relaxed Linen Shirt');
  });

  it('returns featured products', () => {
    const featured = getFeaturedProducts();
    expect(featured.length).toBeGreaterThan(0);
  });

  it('filters by category slug', () => {
    const menProducts = getProductsByCategory('men');
    expect(menProducts.some((item) => item.slug === 'relaxed-linen-shirt')).toBe(true);
  });
});
