import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('storeSettings').first();
  },
});

export const upsert = mutation({
  args: {
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.optional(v.boolean()),
    saleBannerText: v.optional(v.string()),
    saleBannerLink: v.optional(v.string()),
    announcementBar: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupHours: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTiktok: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('storeSettings').first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert('storeSettings', {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
