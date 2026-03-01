import { DEFAULT_SHIPPING_FEE } from '@/lib/constants';
import { DeliveryMethod, OrderItem } from '@/lib/types';

export function calculateSubtotal(items: Array<Pick<OrderItem, 'price' | 'quantity'>>): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateShippingFee(method: DeliveryMethod): number {
  return method === 'pickup' ? 0 : DEFAULT_SHIPPING_FEE;
}

export function generateOrderNumber(sequence: number, now = new Date()): string {
  const year = now.getFullYear();
  return `ORD-${year}-${String(sequence).padStart(4, '0')}`;
}
