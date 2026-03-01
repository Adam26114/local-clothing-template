import type { DataSourceSelection } from '@/lib/data/source';

let lastSelectionKey = '';

type DataSourceBreadcrumb = {
  at: number;
  source: DataSourceSelection['source'];
  requested: DataSourceSelection['requested'];
  convexConfigured: boolean;
  fallbackReason?: string;
};

declare global {
  var __KHIT_DATA_BREADCRUMBS__: DataSourceBreadcrumb[] | undefined;
}

export function addDataSourceBreadcrumb(selection: DataSourceSelection) {
  const key = JSON.stringify(selection);
  if (key === lastSelectionKey) {
    return;
  }

  lastSelectionKey = key;

  const message = `Data source selected: ${selection.source}`;

  if (selection.fallbackReason) {
    console.warn(`[data-source] ${message}. ${selection.fallbackReason}`);
  } else {
    console.info(`[data-source] ${message}.`);
  }

  const existing = globalThis.__KHIT_DATA_BREADCRUMBS__ ?? [];
  existing.push({
    at: Date.now(),
    source: selection.source,
    requested: selection.requested,
    convexConfigured: selection.convexConfigured,
    fallbackReason: selection.fallbackReason,
  });
  globalThis.__KHIT_DATA_BREADCRUMBS__ = existing.slice(-50);
}
