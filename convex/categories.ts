import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  collectCategoryDeleteIds,
  hasLinkedProductsInCategoryTree,
} from '../src/lib/utils/category-delete';

type CategoryRecord = {
  _id: Id<'categories'>;
  name: string;
  slug: string;
  description?: string;
  parentId?: Id<'categories'>;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  parentId?: Id<'categories'>;
  sortOrder: number;
  isActive: boolean;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function ensureUniqueSlug(
  ctx: {
    db: {
      query: (table: 'categories') => {
        collect: () => Promise<CategoryRecord[]>;
      };
    };
  },
  slugInput: string,
  excludeId?: Id<'categories'>
) {
  const rows = (await ctx.db.query('categories').collect()) as CategoryRecord[];
  const base = normalizeSlug(slugInput) || 'category';
  let candidate = base;
  let attempt = 1;

  while (true) {
    const existing = rows.find((row) => row.slug === candidate && row._id !== excludeId);

    if (!existing || existing._id === excludeId) {
      return candidate;
    }

    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

async function descendantIds(
  ctx: {
    db: {
      query: (table: 'categories') => {
        collect: () => Promise<CategoryRecord[]>;
      };
    };
  },
  rootId: Id<'categories'>
) {
  const rows = (await ctx.db.query('categories').collect()) as CategoryRecord[];
  const descendants = new Set<Id<'categories'>>();
  const queue: Id<'categories'>[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const children = rows.filter((row) => row.parentId === current);

    for (const child of children) {
      if (descendants.has(child._id)) continue;
      descendants.add(child._id);
      queue.push(child._id);
    }
  }

  return descendants;
}

function normalizeCategoryInput(input: CategoryInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Category name is required.');
  }

  return {
    name,
    slug: input.slug?.trim() || name,
    description: input.description?.trim() || undefined,
    parentId: input.parentId,
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.floor(input.sortOrder)) : 0,
    isActive: input.isActive,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = (await ctx.db.query('categories').collect()) as CategoryRecord[];
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const byId = query({
  args: { id: v.id('categories') },
  handler: async (ctx, args: { id: Id<'categories'> }) => {
    return (await ctx.db.get(args.id)) as CategoryRecord | null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args: CategoryInput) => {
    const normalized = normalizeCategoryInput(args);

    if (normalized.parentId) {
      const parent = (await ctx.db.get(normalized.parentId)) as CategoryRecord | null;
      if (!parent) {
        throw new Error('Selected parent category does not exist.');
      }
      if (normalized.isActive && !parent.isActive) {
        throw new Error('Cannot create an active child under an inactive parent.');
      }
    }

    const now = Date.now();
    const slug = await ensureUniqueSlug(ctx, normalized.slug);

    return await ctx.db.insert('categories', {
      name: normalized.name,
      slug,
      description: normalized.description,
      parentId: normalized.parentId,
      sortOrder: normalized.sortOrder,
      isActive: normalized.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('categories'),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args: CategoryInput & { id: Id<'categories'> }) => {
    const existing = (await ctx.db.get(args.id)) as CategoryRecord | null;
    if (!existing) {
      throw new Error('Category not found.');
    }

    const normalized = normalizeCategoryInput(args);

    if (normalized.parentId === args.id) {
      throw new Error('Category cannot be its own parent.');
    }

    if (normalized.parentId) {
      const parent = (await ctx.db.get(normalized.parentId)) as CategoryRecord | null;
      if (!parent) {
        throw new Error('Selected parent category does not exist.');
      }

      const descendants = await descendantIds(ctx, args.id);
      if (descendants.has(normalized.parentId)) {
        throw new Error('Category cannot be moved under its own descendant.');
      }

      if (normalized.isActive && !parent.isActive) {
        throw new Error('Cannot set category active while parent is inactive.');
      }
    }

    const slug = await ensureUniqueSlug(ctx, normalized.slug, args.id);

    await ctx.db.patch(args.id, {
      name: normalized.name,
      slug,
      description: normalized.description,
      parentId: normalized.parentId,
      sortOrder: normalized.sortOrder,
      isActive: normalized.isActive,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args: { id: Id<'categories'> }) => {
    const row = (await ctx.db.get(args.id)) as CategoryRecord | null;
    if (!row) {
      throw new Error('Category not found.');
    }

    const categories = (await ctx.db.query('categories').collect()) as CategoryRecord[];
    const products = (await ctx.db.query('products').collect()) as Array<{
      categoryId: Id<'categories'>;
    }>;

    if (hasLinkedProductsInCategoryTree(categories, products, args.id)) {
      throw new Error('Cannot delete a category that still has products assigned. Reassign products first.');
    }

    const ids = collectCategoryDeleteIds(categories, args.id);
    for (const categoryId of ids) {
      await ctx.db.delete(categoryId as Id<'categories'>);
    }
  },
});

export const deactivate = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args: { id: Id<'categories'> }) => {
    const row = (await ctx.db.get(args.id)) as CategoryRecord | null;
    if (!row) {
      throw new Error('Category not found.');
    }

    const now = Date.now();
    const descendants = await descendantIds(ctx, args.id);

    await ctx.db.patch(args.id, { isActive: false, updatedAt: now });
    for (const childId of descendants) {
      await ctx.db.patch(childId, { isActive: false, updatedAt: now });
    }

    return args.id;
  },
});

export const reactivate = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args: { id: Id<'categories'> }) => {
    const row = (await ctx.db.get(args.id)) as CategoryRecord | null;
    if (!row) {
      throw new Error('Category not found.');
    }

    if (row.parentId) {
      const parent = (await ctx.db.get(row.parentId)) as CategoryRecord | null;
      if (!parent || !parent.isActive) {
        throw new Error('Cannot reactivate category while parent is inactive.');
      }
    }

    await ctx.db.patch(args.id, { isActive: true, updatedAt: Date.now() });
    return args.id;
  },
});
