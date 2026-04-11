import { describe, expect, it } from 'vitest';

import type { Category, Product } from '@/lib/types';

import { collectCategoryDeleteIds, hasLinkedProductsInCategoryTree } from './category-delete';

describe('category delete helpers', () => {
  const categories: Category[] = [
    {
      _id: 'root',
      name: 'Root',
      slug: 'root',
      sortOrder: 0,
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    },
    {
      _id: 'child-a',
      name: 'Child A',
      slug: 'child-a',
      parentId: 'root',
      sortOrder: 0,
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    },
    {
      _id: 'child-b',
      name: 'Child B',
      slug: 'child-b',
      parentId: 'child-a',
      sortOrder: 0,
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  const products: Product[] = [
    {
      _id: 'product-1',
      name: 'P1',
      slug: 'p1',
      description: '',
      categoryId: 'child-b',
      isFeatured: false,
      status: 'published',
      isPublished: true,
      colorVariants: [],
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  it('collects a category and all descendants for hard delete', () => {
    expect(Array.from(collectCategoryDeleteIds(categories, 'root'))).toEqual([
      'root',
      'child-a',
      'child-b',
    ]);
  });

  it('detects linked products anywhere in the subtree', () => {
    expect(hasLinkedProductsInCategoryTree(categories, products, 'root')).toBe(true);
    expect(hasLinkedProductsInCategoryTree(categories, products, 'child-a')).toBe(true);
    expect(hasLinkedProductsInCategoryTree(categories, products, 'child-b')).toBe(true);
  });
});
