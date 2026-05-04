import { describe, expect, it } from 'vitest';

import { formatMmk } from '@/lib/utils/currency';

describe('formatMmk', () => {
  it('formats values as comma-separated ks amounts', () => {
    expect(formatMmk(25000)).toBe('25,000 ks');
    expect(formatMmk(0)).toBe('0 ks');
  });
});
