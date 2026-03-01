'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_SHIPPING_FEE } from '@/lib/constants';
import { formatMmk } from '@/lib/currency';
import { storeSettings } from '@/lib/mock-data';
import { useCart } from '@/components/store/cart-context';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const shippingFee = deliveryMethod === 'pickup' ? 0 : DEFAULT_SHIPPING_FEE;
  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    clearCart();
    router.push(`/order-confirmation/${id}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form className="space-y-5 rounded border p-5" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-zinc-600">Payment method: Cash on Delivery (COD)</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" required />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Input id="address" required={deliveryMethod === 'shipping'} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Delivery Method</Label>
          <RadioGroup
            value={deliveryMethod}
            onValueChange={(value) => setDeliveryMethod(value as 'shipping' | 'pickup')}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="shipping" id="shipping" />
              <Label htmlFor="shipping">
                Shipping (1-3 days, {formatMmk(DEFAULT_SHIPPING_FEE)})
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup">Store Pickup (Free)</Label>
            </div>
          </RadioGroup>
          {deliveryMethod === 'pickup' ? (
            <p className="rounded bg-zinc-100 p-3 text-sm text-zinc-700">
              Pickup at: {storeSettings.pickupAddress}. {storeSettings.pickupHours}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Order Notes</Label>
          <Textarea id="notes" placeholder="Optional delivery instructions" />
        </div>

        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-zinc-800"
          disabled={items.length === 0}
        >
          Place Order
        </Button>
      </form>

      <aside className="h-fit rounded border p-5">
        <h2 className="mb-4 font-semibold">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMmk(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span>{formatMmk(shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{formatMmk(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
