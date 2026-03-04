'use client';

import { useState } from 'react';
import { ChevronDown, TableProperties } from 'lucide-react';

import type { SizeKey, VariantMeasurement } from '@/lib/types';
import { cn } from '@/lib/utils';

import {
  MEASUREMENT_FIELDS,
  type MeasurementField,
  getSizeDisplayName,
} from './variant-helpers';

type SizeChartPreviewProps = {
  sizes: SizeKey[];
  measurements?: Partial<Record<SizeKey, VariantMeasurement>>;
};

const MEASUREMENT_LABELS: Record<MeasurementField, string> = {
  shoulder: 'Shoulder',
  chest: 'Chest',
  sleeve: 'Sleeve',
  waist: 'Waist',
  length: 'Length',
};

function inchesToCm(value: number) {
  return Math.round(value * 2.54 * 10) / 10;
}

function formatMeasurement(value: number | undefined, useCm: boolean) {
  if (typeof value !== 'number' || value <= 0) return '—';
  const normalized = useCm ? inchesToCm(value) : Math.round(value * 10) / 10;
  return `${normalized}${useCm ? 'cm' : 'in'}`;
}

export function SizeChartPreview({ sizes, measurements }: SizeChartPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useCm, setUseCm] = useState(false);

  if (sizes.length === 0) return null;

  const hasAnyData = sizes.some((size) => {
    const row = measurements?.[size];
    if (!row) return false;
    return MEASUREMENT_FIELDS.some((field) => {
      const value = row[field];
      return typeof value === 'number' && value > 0;
    });
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent/40"
      >
        <TableProperties className="size-4 text-muted-foreground" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Size Chart Preview
        </span>
        {!hasAnyData ? (
          <span className="text-[10px] text-muted-foreground/70">No data yet</span>
        ) : null}
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen ? (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div className="flex items-center justify-end gap-2 text-[11px] font-semibold tracking-wider">
            <button
              type="button"
              onClick={() => setUseCm(false)}
              className={cn(
                'border-b pb-0.5 uppercase transition-colors',
                useCm
                  ? 'border-transparent text-muted-foreground hover:text-foreground'
                  : 'border-foreground text-foreground'
              )}
            >
              IN
            </button>
            <button
              type="button"
              onClick={() => setUseCm(true)}
              className={cn(
                'border-b pb-0.5 uppercase transition-colors',
                useCm
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              CM
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">Size</th>
                  {MEASUREMENT_FIELDS.map((field) => (
                    <th
                      key={field}
                      className="px-2 py-2 text-right font-medium text-muted-foreground"
                    >
                      {MEASUREMENT_LABELS[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => {
                  const row = measurements?.[size] ?? {};
                  return (
                    <tr key={size} className="border-b border-border/60 last:border-0">
                      <td className="px-2 py-2 font-semibold text-foreground">
                        {getSizeDisplayName(size)}
                      </td>
                      {MEASUREMENT_FIELDS.map((field) => {
                        const value = row[field];
                        const hasValue = typeof value === 'number' && value > 0;

                        return (
                          <td
                            key={field}
                            className={cn(
                              'px-2 py-2 text-right tabular-nums',
                              hasValue ? 'text-foreground' : 'text-muted-foreground/50'
                            )}
                          >
                            {formatMeasurement(value, useCm)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Preview is read-only. Backend continues storing measurements in inches.
          </p>
        </div>
      ) : null}
    </div>
  );
}
