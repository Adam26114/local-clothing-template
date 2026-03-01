import { query } from './_generated/server';

type CategoryRecord = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = (await ctx.db.query('categories').collect()) as CategoryRecord[];
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
