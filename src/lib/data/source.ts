import { addDataSourceBreadcrumb } from '@/lib/data/telemetry';

export type DataSource = 'mock' | 'convex';

export type DataSourceSelection = {
  source: DataSource;
  requested?: DataSource;
  fallbackReason?: string;
  convexConfigured: boolean;
};

const VALID_SOURCES = new Set<DataSource>(['mock', 'convex']);

function parseSource(value: string | undefined): DataSource | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return VALID_SOURCES.has(normalized as DataSource) ? (normalized as DataSource) : undefined;
}

function hasConvexConfig(): boolean {
  return Boolean(process.env.CONVEX_DEPLOYMENT && process.env.NEXT_PUBLIC_CONVEX_URL);
}

export function resolveServerDataSource(): DataSourceSelection {
  const requested = parseSource(process.env.DATA_SOURCE);
  const convexConfigured = hasConvexConfig();

  let selection: DataSourceSelection;
  if (requested === 'mock') {
    selection = {
      source: 'mock',
      requested,
      convexConfigured,
    };
  } else if (requested === 'convex') {
    if (convexConfigured) {
      selection = {
        source: 'convex',
        requested,
        convexConfigured,
      };
    } else {
      selection = {
        source: 'mock',
        requested,
        convexConfigured,
        fallbackReason:
          'DATA_SOURCE is set to convex, but CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL are not both configured.',
      };
    }
  } else {
    selection = {
      source: convexConfigured ? 'convex' : 'mock',
      convexConfigured,
      ...(convexConfigured
        ? {}
        : {
            fallbackReason:
              'Convex env vars are not fully configured. Falling back to mock source.',
          }),
    };
  }

  addDataSourceBreadcrumb(selection);
  return selection;
}

export function resolveClientPreferredSource(): DataSource {
  const fromClientEnv = parseSource(process.env.NEXT_PUBLIC_DATA_SOURCE);
  if (fromClientEnv) {
    return fromClientEnv;
  }

  return parseSource(process.env.DATA_SOURCE) ?? 'mock';
}
