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
  measurements?: Record<
    string,
    {
      shoulder?: number;
      chest?: number;
      sleeve?: number;
      waist?: number;
      length?: number;
    }
  >;
};

type ProductInput = {
  sku?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: Id<'categories'>;
  basePrice?: number;
  salePrice?: number;
  isFeatured: boolean;
  isPublished: boolean;
  colorVariants: ProductVariant[];
};

type ProductRecord = ProductInput & {
  _id: Id<'products'>;
  createdAt: number;
  updatedAt: number;
};

const measurementRecord = v.record(
  v.string(),
  v.object({
    shoulder: v.optional(v.number()),
    chest: v.optional(v.number()),
    sleeve: v.optional(v.number()),
    waist: v.optional(v.number()),
    length: v.optional(v.number()),
  })
);

const colorVariantValidator = v.object({
  id: v.string(),
  colorName: v.string(),
  colorHex: v.string(),
  images: v.array(v.string()),
  selectedSizes: v.array(v.string()),
  stock: v.record(v.string(), v.number()),
  measurements: v.optional(measurementRecord),
});

const productInputValidator = {
  sku: v.optional(v.string()),
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  categoryId: v.id('categories'),
  basePrice: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  isFeatured: v.boolean(),
  isPublished: v.boolean(),
  colorVariants: v.array(colorVariantValidator),
} as const;

type SlugContext = {
  db: {
    query: (table: string) => {
      withIndex: (
        indexName: string,
        callback: (q: { eq: (field: string, value: string) => unknown }) => unknown
      ) => {
        first: () => Promise<unknown>;
      };
    };
  };
};

async function ensureUniqueSlug(ctx: unknown, slug: string, excludeId?: string) {
  const context = ctx as SlugContext;
  const base = slug.trim().toLowerCase() || 'product';
  let candidate = base;
  let attempt = 1;

  while (true) {
    const existing = (await context.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', candidate))
      .first()) as ProductRecord | null;

    if (!existing || String(existing._id) === excludeId) {
      return candidate;
    }

    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export const list = query({
  args: {
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args: { publishedOnly?: boolean }) => {
    const rows = (await ctx.db.query('products').collect()) as ProductRecord[];
    const filtered = args.publishedOnly ? rows.filter((row) => row.isPublished) : rows;
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const byId = query({
  args: { id: v.id('products') },
  handler: async (ctx, args: { id: Id<'products'> }) => {
    return (await ctx.db.get(args.id)) as ProductRecord | null;
  },
});

export const bySlug = query({
  args: {
    slug: v.string(),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args: { slug: string; publishedOnly?: boolean }) => {
    const product = (await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()) as ProductRecord | null;

    if (!product) return null;
    if (args.publishedOnly !== false && !product.isPublished) {
      return null;
    }

    return product;
  },
});

export const create = mutation({
  args: productInputValidator,
  handler: async (ctx, args: ProductInput) => {
    const now = Date.now();
    const slug = await ensureUniqueSlug(ctx, args.slug);

    return await ctx.db.insert('products', {
      ...args,
      slug,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('products'),
    ...productInputValidator,
  },
  handler: async (ctx, args: ProductInput & { id: Id<'products'> }) => {
    const { id, ...changes } = args;
    const existing = (await ctx.db.get(id)) as ProductRecord | null;
    if (!existing) {
      throw new Error('Product not found.');
    }

    const slug = await ensureUniqueSlug(ctx, changes.slug, id);

    await ctx.db.patch(id, {
      ...changes,
      slug,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const softDelete = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args: { id: Id<'products'> }) => {
    const existing = (await ctx.db.get(args.id)) as ProductRecord | null;
    if (!existing) return args.id;

    await ctx.db.patch(args.id, { isPublished: false, updatedAt: Date.now() });
    return args.id;
  },
});

export const duplicate = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args: { id: Id<'products'> }) => {
    const source = (await ctx.db.get(args.id)) as ProductRecord | null;
    if (!source) {
      throw new Error('Product not found.');
    }

    const now = Date.now();
    const duplicatedSlug = await ensureUniqueSlug(ctx, `${source.slug}-copy`);

    return await ctx.db.insert('products', {
      sku: source.sku ? `${source.sku}-COPY` : undefined,
      name: `${source.name} (Copy)`,
      slug: duplicatedSlug,
      description: source.description,
      categoryId: source.categoryId,
      basePrice: source.basePrice,
      salePrice: source.salePrice,
      isFeatured: source.isFeatured,
      isPublished: false,
      colorVariants: source.colorVariants.map((variant) => ({
        ...variant,
        id: `${variant.id}-copy-${randomSuffix()}`,
      })),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleBulkStatus = mutation({
  args: {
    ids: v.array(v.id('products')),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args: { ids: Id<'products'>[]; isPublished: boolean }) => {
    let updatedCount = 0;

    for (const id of args.ids) {
      const row = (await ctx.db.get(id)) as ProductRecord | null;
      if (!row) continue;
      await ctx.db.patch(id, {
        isPublished: args.isPublished,
        updatedAt: Date.now(),
      });
      updatedCount += 1;
    }

    return updatedCount;
  },
});
