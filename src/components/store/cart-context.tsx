'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { products } from '@/lib/mock-data';
import { SizeKey } from '@/lib/types';

type StoredCartItem = {
  productId: string;
  colorVariantId: string;
  size: SizeKey;
  quantity: number;
};

type CartContextValue = {
  items: StoredCartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: StoredCartItem) => void;
  updateQuantity: (key: Omit<StoredCartItem, 'quantity'>, quantity: number) => void;
  removeItem: (key: Omit<StoredCartItem, 'quantity'>) => void;
  clearCart: () => void;
};

const STORAGE_KEY = 'khit_cart';
const CartContext = createContext<CartContextValue | undefined>(undefined);

function getUnitPrice(productId: string): number {
  const product = products.find((item) => item._id === productId);
  if (!product) return 0;
  return product.salePrice ?? product.basePrice ?? 0;
}

function isSameLine(
  a: Omit<StoredCartItem, 'quantity'>,
  b: Omit<StoredCartItem, 'quantity'>
): boolean {
  return a.productId === b.productId && a.colorVariantId === b.colorVariantId && a.size === b.size;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StoredCartItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed as StoredCartItem[];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: StoredCartItem) => {
    setItems((prev) => {
      const index = prev.findIndex((line) => isSameLine(line, item));
      if (index < 0) return [...prev, item];
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + item.quantity };
      return next;
    });
  }, []);

  const updateQuantity = useCallback((key: Omit<StoredCartItem, 'quantity'>, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => !isSameLine(item, key));
      }
      return prev.map((item) => (isSameLine(item, key) ? { ...item, quantity } : item));
    });
  }, []);

  const removeItem = useCallback((key: Omit<StoredCartItem, 'quantity'>) => {
    setItems((prev) => prev.filter((item) => !isSameLine(item, key)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + getUnitPrice(item.productId) * item.quantity, 0);
  }, [items]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, subtotal, totalItems, addItem, updateQuantity, removeItem, clearCart }),
    [items, subtotal, totalItems, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
