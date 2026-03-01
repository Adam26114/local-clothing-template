import { createAdapterFactory } from 'better-auth/adapters';

import { authRefs, getAuthConvexClient } from '@/lib/auth/convex-auth-client';

type AuthModel = 'authUsers' | 'authSessions' | 'authAccounts' | 'authVerificationTokens';

type AdapterWhere = {
  field: string;
  operator:
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
  value: string | number | boolean | string[] | number[] | Date | null;
  connector: 'AND' | 'OR';
};

const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'expiresAt',
  'accessTokenExpiresAt',
  'refreshTokenExpiresAt',
]);

function serializeValue(field: string, value: unknown) {
  if (value instanceof Date && DATE_FIELDS.has(field)) {
    return value.getTime();
  }
  return value;
}

function deserializeValue(field: string, value: unknown) {
  if (DATE_FIELDS.has(field) && typeof value === 'number') {
    return new Date(value);
  }
  return value;
}

function serializeRecord(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, serializeValue(key, value)])
  );
}

function deserializeRecord<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, deserializeValue(key, value)])
  ) as T;
}

function serializeWhere(where: AdapterWhere[]) {
  return where.map((clause) => ({
    ...clause,
    value: clause.value instanceof Date ? clause.value.getTime() : (clause.value as unknown),
  }));
}

async function findManyRaw<T extends Record<string, unknown>>(args: {
  model: string;
  where?: AdapterWhere[];
  limit?: number;
  offset?: number;
  select?: string[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
}) {
  const client = getAuthConvexClient();
  const rows = (await client.query(authRefs.authFindMany, {
    model: args.model as AuthModel,
    where: args.where ? serializeWhere(args.where) : undefined,
    limit: args.limit,
    offset: args.offset,
    select: args.select,
    sortBy: args.sortBy,
  })) as T[];

  return rows.map((row) => deserializeRecord(row));
}

async function attachJoinData<T extends Record<string, unknown>>(
  rows: T[],
  join?: Record<
    string,
    {
      on: { from: string; to: string };
      relation?: 'one-to-one' | 'one-to-many' | 'many-to-many';
      limit?: number;
    }
  >
) {
  if (!join || rows.length === 0) return rows;

  const joinedRows: Record<string, unknown>[] = [];
  for (const row of rows) {
    const current = { ...row } as Record<string, unknown>;

    for (const [joinModel, config] of Object.entries(join)) {
      const sourceValue = current[config.on.from];
      const normalizedValue =
        typeof sourceValue === 'string' ||
        typeof sourceValue === 'number' ||
        typeof sourceValue === 'boolean' ||
        sourceValue == null
          ? (sourceValue ?? null)
          : String(sourceValue ?? '');

      const related = await findManyRaw({
        model: joinModel,
        where: [
          {
            field: config.on.to,
            operator: 'eq',
            value: normalizedValue,
            connector: 'AND',
          },
        ],
        limit: config.limit,
      });

      if (config.relation === 'one-to-one') {
        current[joinModel] = related[0] ?? null;
      } else {
        current[joinModel] = related;
      }
    }

    joinedRows.push(current);
  }

  return joinedRows as T[];
}

export const convexBetterAuthAdapter = () =>
  createAdapterFactory({
    config: {
      adapterId: 'convex-custom',
      adapterName: 'Convex Custom Adapter',
      supportsDates: true,
      supportsJSON: true,
      supportsBooleans: true,
      supportsArrays: true,
      usePlural: false,
      transaction: false,
    },
    adapter: () => ({
      async create<T extends Record<string, unknown>>({ model, data }: { model: string; data: T }) {
        const client = getAuthConvexClient();
        const created = (await client.mutation(authRefs.authCreate, {
          model: model as AuthModel,
          data: serializeRecord(data),
        })) as T;
        return deserializeRecord(created);
      },

      async findOne<T>({
        model,
        where,
        select,
        join,
      }: {
        model: string;
        where: AdapterWhere[];
        select?: string[];
        join?: Record<
          string,
          {
            on: { from: string; to: string };
            relation?: 'one-to-one' | 'one-to-many' | 'many-to-many';
            limit?: number;
          }
        >;
      }) {
        if (join) {
          const rows = await findManyRaw<Record<string, unknown>>({
            model,
            where,
            limit: 1,
            select,
          });
          const withJoin = await attachJoinData(rows, join);
          return (withJoin[0] as T | undefined) ?? null;
        }

        const client = getAuthConvexClient();
        const row = (await client.query(authRefs.authFindOne, {
          model: model as AuthModel,
          where: serializeWhere(where),
          select,
        })) as Record<string, unknown> | null;

        return row ? (deserializeRecord(row) as T) : null;
      },

      async findMany<T>({
        model,
        where,
        limit,
        select,
        sortBy,
        offset,
        join,
      }: {
        model: string;
        where?: AdapterWhere[];
        limit: number;
        select?: string[];
        sortBy?: { field: string; direction: 'asc' | 'desc' };
        offset?: number;
        join?: Record<
          string,
          {
            on: { from: string; to: string };
            relation?: 'one-to-one' | 'one-to-many' | 'many-to-many';
            limit?: number;
          }
        >;
      }) {
        const rows = await findManyRaw<Record<string, unknown>>({
          model,
          where,
          limit,
          select,
          sortBy,
          offset,
        });

        if (!join) {
          return rows as T[];
        }

        const withJoin = await attachJoinData(rows, join);
        return withJoin as T[];
      },

      async count({ model, where }: { model: string; where?: AdapterWhere[] }) {
        const client = getAuthConvexClient();
        return (await client.query(authRefs.authCount, {
          model: model as AuthModel,
          where: where ? serializeWhere(where) : undefined,
        })) as number;
      },

      async update<T>({
        model,
        where,
        update,
      }: {
        model: string;
        where: AdapterWhere[];
        update: T;
      }) {
        const client = getAuthConvexClient();
        const updated = (await client.mutation(authRefs.authUpdate, {
          model: model as AuthModel,
          where: serializeWhere(where),
          update: serializeRecord(update as Record<string, unknown>),
        })) as Record<string, unknown> | null;

        return updated ? (deserializeRecord(updated) as T) : null;
      },

      async updateMany({
        model,
        where,
        update,
      }: {
        model: string;
        where: AdapterWhere[];
        update: Record<string, unknown>;
      }) {
        const client = getAuthConvexClient();
        return (await client.mutation(authRefs.authUpdateMany, {
          model: model as AuthModel,
          where: serializeWhere(where),
          update: serializeRecord(update),
        })) as number;
      },

      async delete({ model, where }: { model: string; where: AdapterWhere[] }) {
        const client = getAuthConvexClient();
        await client.mutation(authRefs.authRemove, {
          model: model as AuthModel,
          where: serializeWhere(where),
        });
      },

      async deleteMany({ model, where }: { model: string; where: AdapterWhere[] }) {
        const client = getAuthConvexClient();
        return (await client.mutation(authRefs.authRemoveMany, {
          model: model as AuthModel,
          where: serializeWhere(where),
        })) as number;
      },
    }),
  });
