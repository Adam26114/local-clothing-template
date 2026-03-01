import { AlertTriangle } from 'lucide-react';

import type { DataSourceSelection } from '@/lib/data/source';

type DataSourceNoticeProps = {
  selection: DataSourceSelection;
  className?: string;
};

export function DataSourceNotice({ selection, className }: DataSourceNoticeProps) {
  if (!(selection.requested === 'convex' && selection.source === 'mock')) {
    return null;
  }

  return (
    <div
      className={[
        'flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AlertTriangle className="mt-0.5 size-4" />
      <p>
        Convex mode is requested but not configured in this environment. Showing fallback mock data.
      </p>
    </div>
  );
}
