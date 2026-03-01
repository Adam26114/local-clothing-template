import { mutation } from './_generated/server';

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('categories').collect();
    if (existing.length > 0) {
      return { ok: true, skipped: true };
    }

    const now = Date.now();
    const men = await ctx.db.insert('categories', {
      name: 'MEN',
      slug: 'men',
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('categories', {
      name: 'Shirts',
      slug: 'shirts',
      parentId: men,
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, skipped: false };
  },
});
