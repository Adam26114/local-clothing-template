import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

export const byEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

export const byBetterAuthId = query({
  args: { betterAuthId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_betterAuthId', (q) => q.eq('betterAuthId', args.betterAuthId))
      .first();
  },
});

export const upsertFromAuth = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    betterAuthId: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal('customer'), v.literal('admin')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        phone: args.phone,
        role: args.role,
        betterAuthId: args.betterAuthId,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      betterAuthId: args.betterAuthId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
