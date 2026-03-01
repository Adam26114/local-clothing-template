'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

import { useCart } from '@/components/store/cart-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { formatMmk } from '@/lib/currency';
import { Product, SizeKey, StoreSettings } from '@/lib/types';

export function ProductDetailPageClient({
  product,
  relatedProducts,
  storeSettings,
}: {
  product: Product | undefined;
  relatedProducts: Product[];
  storeSettings: StoreSettings;
}) {
  const { addItem } = useCart();

  const [variantIndex, setVariantIndex] = useState(0);
  const selectedVariant = product?.colorVariants[variantIndex];
  const firstSize = selectedVariant?.selectedSizes[0] ?? 'M';
  const [size, setSize] = useState<SizeKey>(firstSize as SizeKey);

  if (!product || !selectedVariant) {
    return <p className="text-sm text-zinc-600">Product not found.</p>;
  }

  const currentStock = selectedVariant.stock[size] ?? 0;
  const isOut = currentStock <= 0;
  const lowStock = currentStock > 0 && currentStock < 5;

  const addToCart = () => {
    if (isOut) {
      toast.error('Item sold out. Removed from cart.');
      return;
    }

    addItem({
      productId: product._id,
      colorVariantId: selectedVariant.id,
      size,
      quantity: 1,
    });
    toast.success('Added to bag');
  };

  return (
    <div className="space-y-8">
      <nav className="text-xs text-zinc-500 uppercase">MEN &gt; SHIRTS &gt; {product.name}</nav>
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {(selectedVariant.images.length > 0 ? selectedVariant.images : ['/placeholder.jpg']).map(
            (image, index) => (
              <div key={`${image}-${index}`} className="aspect-[3/4] rounded bg-zinc-100" />
            )
          )}
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <div className="flex items-center gap-3 text-lg">
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

          <div className="space-y-2">
            <p className="text-sm font-medium">Color</p>
            <div className="flex gap-2">
              {product.colorVariants.map((variant, index) => (
                <button
                  key={variant.id}
                  type="button"
                  title={variant.colorName}
                  onClick={() => {
                    setVariantIndex(index);
                    setSize((variant.selectedSizes[0] ?? 'M') as SizeKey);
                  }}
                  className={`size-8 rounded-full border ${variantIndex === index ? 'ring-2 ring-black' : ''}`}
                  style={{ backgroundColor: variant.colorHex }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Size</p>
            <div className="flex flex-wrap gap-2">
              {selectedVariant.selectedSizes.map((item) => {
                const stock = selectedVariant.stock[item] ?? 0;
                const disabled = stock <= 0;
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSize(item)}
                    className={`rounded border px-3 py-2 text-sm ${
                      item === size ? 'bg-black text-white' : 'bg-white text-black'
                    } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {lowStock ? (
              <p className="text-xs text-orange-600">Low stock: only {currentStock} left</p>
            ) : null}
            {isOut ? <p className="text-xs text-red-600">Out of stock</p> : null}
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-black text-white hover:bg-zinc-800"
              disabled={isOut}
              onClick={addToCart}
            >
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" aria-label="Add to wishlist">
              <Heart className="size-4" />
            </Button>
          </div>

          <p className="text-sm text-zinc-600">Free delivery to store</p>
          <p className="text-sm text-zinc-600">
            Store pickup: {storeSettings.pickupAddress} ({storeSettings.pickupHours})
          </p>

          <Accordion type="single" collapsible>
            <AccordionItem value="description">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Care Instructions</AccordionTrigger>
              <AccordionContent>Cold wash, dry on low heat, iron medium.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="size-fit">
              <AccordionTrigger>Size &amp; Fit</AccordionTrigger>
              <AccordionContent>
                Regular fit. For oversized style, choose one size up.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">You May Also Like</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((item) => (
            <Link
              key={item._id}
              href={`/products/${item.slug}`}
              className="rounded border p-3 text-sm hover:bg-zinc-50"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
