'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { formatMmk } from '@/lib/currency';
import { products } from '@/lib/mock-data';
import { useCart } from '@/components/store/cart-context';

function itemPrice(productId: string): number {
  const product = products.find((item) => item._id === productId);
  return product?.salePrice ?? product?.basePrice ?? 0;
}

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Shopping Bag</h1>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">Your bag is empty.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => {
              const product = products.find((entry) => entry._id === item.productId);
              if (!product) return null;

              return (
                <article
                  key={`${item.productId}-${item.colorVariantId}-${item.size}`}
                  className="rounded border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-medium">{product.name}</h2>
                      <p className="text-sm text-zinc-600">
                        Size {item.size} · {item.colorVariantId}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatMmk(itemPrice(item.productId) * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border px-2 py-1"
                      onClick={() =>
                        updateQuantity(
                          {
                            productId: item.productId,
                            colorVariantId: item.colorVariantId,
                            size: item.size,
                          },
                          Math.max(1, item.quantity - 1)
                        )
                      }
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      className="rounded border px-2 py-1"
                      onClick={() =>
                        updateQuantity(
                          {
                            productId: item.productId,
                            colorVariantId: item.colorVariantId,
                            size: item.size,
                          },
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-sm text-red-600"
                      onClick={() =>
                        removeItem({
                          productId: item.productId,
                          colorVariantId: item.colorVariantId,
                          size: item.size,
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="h-fit rounded border p-4">
            <h3 className="mb-4 font-semibold">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMmk(subtotal)}</span>
              </div>
            </div>
            <Button asChild className="mt-5 w-full bg-black text-white hover:bg-zinc-800">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
