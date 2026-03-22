import { describe, expect, it } from 'vitest';

import type { Category } from '@/lib/types';

import { mergeVisibleOrder } from './category-order';

describe('mergeVisibleOrder', () => {
  it('keeps hidden rows in place while applying the reordered visible rows', () => {
    const previousRows = [
      { _id: 'a', name: 'A', slug: 'a', sortOrder: 0, isActive: true, createdAt: 1, updatedAt: 1 },
      { _id: 'b', name: 'B', slug: 'b', sortOrder: 1, isActive: true, createdAt: 2, updatedAt: 2 },
      { _id: 'c', name: 'C', slug: 'c', sortOrder: 2, isActive: true, createdAt: 3, updatedAt: 3 },
      { _id: 'd', name: 'D', slug: 'd', sortOrder: 3, isActive: true, createdAt: 4, updatedAt: 4 },
    ] satisfies Category[];

    const reorderedRows = [previousRows[2], previousRows[0]];

    expect(mergeVisibleOrder(previousRows, reorderedRows).map((row) => row._id)).toEqual([
      'c',
      'b',
      'a',
      'd',
    ]);
  });
});
