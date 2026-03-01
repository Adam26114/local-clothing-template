import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

type ProductVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  selectedSizes: string[];
  stock: Record<string, number>;
};

type ProductRecord = {
  _id: Id<'products'>;
  name: string;
  isPublished: boolean;
  colorVariants: ProductVariant[];
};

type InventoryAuditRecord = {
  _id: Id<'inventoryAuditLogs'>;
  productId: Id<'products'>;
  variantId: string;
  size: string;
  oldValue: number;
  newValue: number;
  changedBy: string;
  changedAt: number;
};

function byProductNameThenVariant(
  a: {
    productName: string;
    colorName: string;
    size: string;
  },
  b: {
    productName: string;
    colorName: string;
    size: string;
  }
) {
  const productCompare = a.productName.localeCompare(b.productName);
  if (productCompare !== 0) return productCompare;

  const colorCompare = a.colorName.localeCompare(b.colorName);
  if (colorCompare !== 0) return colorCompare;

  return a.size.localeCompare(b.size);
}

export const listFlattened = query({
  args: {},
  handler: async (ctx) => {
    const products = (await ctx.db.query('products').collect()) as ProductRecord[];

    const rows = products.flatMap((product) =>
      product.colorVariants.flatMap((variant) =>
        variant.selectedSizes.map((size) => ({
          productId: String(product._id),
          productName: product.name,
          variantId: variant.id,
          colorName: variant.colorName,
          size,
          stock: variant.stock[size] ?? 0,
          isPublished: product.isPublished,
        }))
      )
    );

    return rows.sort(byProductNameThenVariant);
  },
});

export const updateStockWithAudit = mutation({
  args: {
    productId: v.id('products'),
    variantId: v.string(),
    size: v.string(),
    newValue: v.number(),
    changedBy: v.string(),
  },
  handler: async (
    ctx,
    args: {
      productId: Id<'products'>;
      variantId: string;
      size: string;
      newValue: number;
      changedBy: string;
    }
  ) => {
    const product = (await ctx.db.get(args.productId)) as ProductRecord | null;
    if (!product) {
      throw new Error('Product not found.');
    }

    const variantIndex = product.colorVariants.findIndex((entry) => entry.id === args.variantId);
    if (variantIndex < 0) {
      throw new Error('Variant not found.');
    }

    const variant = product.colorVariants[variantIndex];
    const currentValue = variant.stock[args.size] ?? 0;
    const normalizedValue = Math.max(0, Math.floor(args.newValue));

    const nextVariant = {
      ...variant,
      stock: {
        ...variant.stock,
        [args.size]: normalizedValue,
      },
      selectedSizes: variant.selectedSizes.includes(args.size)
        ? variant.selectedSizes
        : [...variant.selectedSizes, args.size],
    };

    const nextVariants = [...product.colorVariants];
    nextVariants[variantIndex] = nextVariant;

    await ctx.db.patch(args.productId, {
      colorVariants: nextVariants,
      updatedAt: Date.now(),
    });

    const logId = await ctx.db.insert('inventoryAuditLogs', {
      productId: args.productId,
      variantId: args.variantId,
      size: args.size,
      oldValue: currentValue,
      newValue: normalizedValue,
      changedBy: args.changedBy,
      changedAt: Date.now(),
    });

    const log = (await ctx.db.get(logId)) as InventoryAuditRecord | null;

    return {
      row: {
        productId: String(product._id),
        productName: product.name,
        variantId: args.variantId,
        colorName: variant.colorName,
        size: args.size,
        stock: normalizedValue,
        isPublished: product.isPublished,
      },
      log,
    };
  },
});

export const listAuditLogs = query({
  args: {
    productId: v.optional(v.id('products')),
    variantId: v.optional(v.string()),
    size: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args: { productId?: Id<'products'>; variantId?: string; size?: string; limit?: number }
  ) => {
    const logs = (await ctx.db.query('inventoryAuditLogs').collect()) as InventoryAuditRecord[];

    return logs
      .filter((entry) => {
        if (args.productId && entry.productId !== args.productId) return false;
        if (args.variantId && entry.variantId !== args.variantId) return false;
        if (args.size && entry.size !== args.size) return false;
        return true;
      })
      .sort((a, b) => b.changedAt - a.changedAt)
      .slice(0, args.limit ?? 50);
  },
});
