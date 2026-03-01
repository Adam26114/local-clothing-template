import { describe, expect, it } from 'vitest';

import { calculateShippingFee, calculateSubtotal, generateOrderNumber } from '@/lib/order-utils';

describe('order-utils', () => {
  it('calculates subtotal from line items', () => {
    const subtotal = calculateSubtotal([
      { price: 49000, quantity: 1 },
      { price: 12000, quantity: 2 },
    ]);

    expect(subtotal).toBe(73000);
  });

  it('returns free shipping for pickup', () => {
    expect(calculateShippingFee('pickup')).toBe(0);
  });

  it('formats order number with padded sequence', () => {
    const orderNumber = generateOrderNumber(7, new Date('2026-02-27T00:00:00Z'));
    expect(orderNumber).toBe('ORD-2026-0007');
  });
});
