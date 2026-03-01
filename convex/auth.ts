import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const authModel = v.union(
  v.literal('authUsers'),
  v.literal('authSessions'),
  v.literal('authAccounts'),
  v.literal('authVerificationTokens')
);

const whereClause = v.object({
  field: v.string(),
  operator: v.optional(
    v.union(
      v.literal('eq'),
      v.literal('ne'),
      v.literal('lt'),
      v.literal('lte'),
      v.literal('gt'),
      v.literal('gte'),
      v.literal('in'),
      v.literal('not_in'),
      v.literal('contains'),
      v.literal('starts_with'),
      v.literal('ends_with')
    )
  ),
  value: v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.array(v.number()),
    v.null()
  ),
  connector: v.optional(v.union(v.literal('AND'), v.literal('OR'))),
});

type AuthModel = 'authUsers' | 'authSessions' | 'authAccounts' | 'authVerificationTokens';
type Operator =
  | 'eq'
  | 'ne'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'starts_with'
  | 'ends_with';

type WhereClause = {
  field: string;
  value: string | number | boolean | string[] | number[] | null;
  operator?: Operator;
  connector?: 'AND' | 'OR';
};

function evaluateClause(doc: Record<string, unknown>, clause: WhereClause): boolean {
  const fieldValue = doc[clause.field];
  const operator = clause.operator ?? 'eq';
  const value = clause.value;

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'ne':
      return fieldValue !== value;
    case 'lt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
    case 'lte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
    case 'gt':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
    case 'gte':
      return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue as never) : false;
    case 'not_in':
      return Array.isArray(value) ? !value.includes(fieldValue as never) : false;
    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string'
        ? fieldValue.includes(value)
        : false;
    case 'starts_with':
      return typeof fieldValue === 'string' && typeof value === 'string'
        ? fieldValue.startsWith(value)
        : false;
    case 'ends_with':
      return typeof fieldValue === 'string' && typeof value === 'string'
        ? fieldValue.endsWith(value)
        : false;
    default:
      return false;
  }
}

function matchesWhere(doc: Record<string, unknown>, where: WhereClause[]): boolean {
  if (where.length === 0) return true;

  let result = evaluateClause(doc, where[0]);
  for (let i = 1; i < where.length; i += 1) {
    const clause = where[i];
    const clauseResult = evaluateClause(doc, clause);
    if ((clause.connector ?? 'AND') === 'OR') {
      result = result || clauseResult;
    } else {
      result = result && clauseResult;
    }
  }

  return result;
}

function pickFields(doc: Record<string, unknown>, select?: string[]) {
  if (!select || select.length === 0) return doc;
  return Object.fromEntries(Object.entries(doc).filter(([key]) => select.includes(key)));
}

async function listModel(
  ctx: { db: { query: (table: AuthModel) => { collect: () => Promise<unknown[]> } } },
  model: AuthModel
) {
  return (await ctx.db.query(model).collect()) as Record<string, unknown>[];
}

export const create = mutation({
  args: {
    model: authModel,
    data: v.any(),
  },
  handler: async (ctx, args: { model: AuthModel; data: Record<string, unknown> }) => {
    const insertedId = await (ctx.db as unknown as {
      insert: (table: AuthModel, value: Record<string, unknown>) => Promise<unknown>;
    }).insert(args.model, args.data);
    return await ctx.db.get(insertedId as never);
  },
});

export const findOne = query({
  args: {
    model: authModel,
    where: v.array(whereClause),
    select: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args: { model: AuthModel; where: WhereClause[]; select?: string[] }) => {
    const rows = await listModel(ctx, args.model);
    const row = rows.find((entry) => matchesWhere(entry, args.where));
    return row ? pickFields(row, args.select) : null;
  },
});

export const findMany = query({
  args: {
    model: authModel,
    where: v.optional(v.array(whereClause)),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    select: v.optional(v.array(v.string())),
    sortBy: v.optional(
      v.object({
        field: v.string(),
        direction: v.union(v.literal('asc'), v.literal('desc')),
      })
    ),
  },
  handler: async (
    ctx,
    args: {
      model: AuthModel;
      where?: WhereClause[];
      limit?: number;
      offset?: number;
      select?: string[];
      sortBy?: { field: string; direction: 'asc' | 'desc' };
    }
  ) => {
    const rows = await listModel(ctx, args.model);
    const filtered = (
      args.where?.length ? rows.filter((entry) => matchesWhere(entry, args.where!)) : rows
    ).map((entry) => pickFields(entry, args.select));

    const sorted = args.sortBy
      ? [...filtered].sort((a, b) => {
          const aValue = (a as Record<string, unknown>)[args.sortBy!.field];
          const bValue = (b as Record<string, unknown>)[args.sortBy!.field];
          if (aValue === bValue) return 0;
          if (aValue == null) return args.sortBy!.direction === 'asc' ? -1 : 1;
          if (bValue == null) return args.sortBy!.direction === 'asc' ? 1 : -1;
          if (aValue > bValue) return args.sortBy!.direction === 'asc' ? 1 : -1;
          return args.sortBy!.direction === 'asc' ? -1 : 1;
        })
      : filtered;

    const offset = Math.max(0, args.offset ?? 0);
    const paged = sorted.slice(
      offset,
      args.limit != null ? offset + Math.max(0, args.limit) : undefined
    );
    return paged;
  },
});

export const count = query({
  args: {
    model: authModel,
    where: v.optional(v.array(whereClause)),
  },
  handler: async (ctx, args: { model: AuthModel; where?: WhereClause[] }) => {
    const rows = await listModel(ctx, args.model);
    if (!args.where?.length) {
      return rows.length;
    }
    return rows.filter((entry) => matchesWhere(entry, args.where!)).length;
  },
});

export const update = mutation({
  args: {
    model: authModel,
    where: v.array(whereClause),
    update: v.any(),
  },
  handler: async (
    ctx,
    args: { model: AuthModel; where: WhereClause[]; update: Record<string, unknown> }
  ) => {
    const rows = await listModel(ctx, args.model);
    const matched = rows.find((entry) => matchesWhere(entry, args.where));
    if (!matched?._id) return null;

    await ctx.db.patch(matched._id as never, args.update);
    return await ctx.db.get(matched._id as never);
  },
});

export const updateMany = mutation({
  args: {
    model: authModel,
    where: v.array(whereClause),
    update: v.any(),
  },
  handler: async (
    ctx,
    args: { model: AuthModel; where: WhereClause[]; update: Record<string, unknown> }
  ) => {
    const rows = await listModel(ctx, args.model);
    const matched = rows.filter((entry) => matchesWhere(entry, args.where));

    for (const row of matched) {
      if (!row._id) continue;
      await ctx.db.patch(row._id as never, args.update);
    }

    return matched.length;
  },
});

export const remove = mutation({
  args: {
    model: authModel,
    where: v.array(whereClause),
  },
  handler: async (ctx, args: { model: AuthModel; where: WhereClause[] }) => {
    const rows = await listModel(ctx, args.model);
    const matched = rows.find((entry) => matchesWhere(entry, args.where));
    if (!matched?._id) return;
    await (ctx.db as unknown as { delete: (id: unknown) => Promise<void> }).delete(matched._id);
  },
});

export const removeMany = mutation({
  args: {
    model: authModel,
    where: v.array(whereClause),
  },
  handler: async (ctx, args: { model: AuthModel; where: WhereClause[] }) => {
    const rows = await listModel(ctx, args.model);
    const matched = rows.filter((entry) => matchesWhere(entry, args.where));

    for (const row of matched) {
      if (!row._id) continue;
      await (ctx.db as unknown as { delete: (id: unknown) => Promise<void> }).delete(row._id);
    }

    return matched.length;
  },
});
