'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Ruler } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SizeKey, VariantMeasurement } from '@/lib/types';

import {
  MEASUREMENT_FIELDS,
  type MeasurementField,
  getSizeDisplayName,
} from './variant-helpers';

type SizeMeasurementsMap = Partial<Record<SizeKey, VariantMeasurement>>;

type SizeMeasurementsInputProps = {
  sizes: SizeKey[];
  measurements?: SizeMeasurementsMap;
  onChange: (size: SizeKey, field: MeasurementField, value: number | undefined) => void;
};

const MEASUREMENT_LABELS: Record<MeasurementField, string> = {
  shoulder: 'Shoulder',
  chest: 'Chest',
  sleeve: 'Sleeve',
  waist: 'Waist',
  length: 'Length',
};

const MEASUREMENT_LIMITS: Record<MeasurementField, { min: number; max: number }> = {
  shoulder: { min: 10, max: 30 },
  chest: { min: 28, max: 60 },
  sleeve: { min: 5, max: 40 },
  waist: { min: 20, max: 56 },
  length: { min: 15, max: 45 },
};

function inchesToCm(value: number) {
  return Math.round(value * 2.54 * 10) / 10;
}

function cmToInches(value: number) {
  return Math.round((value / 2.54) * 10) / 10;
}

function formatNumber(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}`;
}

export function SizeMeasurementsInput({ sizes, measurements, onChange }: SizeMeasurementsInputProps) {
  const [expandedSize, setExpandedSize] = useState<SizeKey | null>(sizes[0] ?? null);
  const [useCm, setUseCm] = useState(false);
  const activeExpandedSize =
    expandedSize && sizes.includes(expandedSize) ? expandedSize : (sizes[0] ?? null);

  const outOfRange = useMemo(() => {
    return sizes.some((size) => {
      const row = measurements?.[size];
      if (!row) return false;

      return MEASUREMENT_FIELDS.some((field) => {
        const value = row[field];
        if (typeof value !== 'number' || value <= 0) return false;

        const limits = MEASUREMENT_LIMITS[field];
        return value < limits.min || value > limits.max;
      });
    });
  }, [measurements, sizes]);

  if (sizes.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="size-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Size measurements
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider">
          <button
            type="button"
            onClick={() => setUseCm(false)}
            className={cn(
              'border-b pb-0.5 uppercase transition-colors',
              useCm ? 'border-transparent text-muted-foreground hover:text-foreground' : 'border-foreground text-foreground'
            )}
          >
            IN
          </button>
          <button
            type="button"
            onClick={() => setUseCm(true)}
            className={cn(
              'border-b pb-0.5 uppercase transition-colors',
              useCm ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            CM
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {sizes.map((size) => {
          const row = measurements?.[size] ?? {};
          const isOpen = activeExpandedSize === size;
          const filledCount = MEASUREMENT_FIELDS.filter((field) => {
            const value = row[field];
            return typeof value === 'number' && value > 0;
          }).length;

          return (
            <div key={size} className="overflow-hidden rounded-md border border-border bg-card">
              <button
                type="button"
                onClick={() => setExpandedSize(isOpen ? null : size)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/50"
              >
                <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                  {getSizeDisplayName(size)}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {filledCount === 0
                    ? 'No measurements'
                    : `${filledCount}/${MEASUREMENT_FIELDS.length} filled`}
                </span>
                <ChevronDown
                  className={cn('size-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                />
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t border-border px-3 py-3">
                  {MEASUREMENT_FIELDS.map((field) => {
                    const stored = row[field];
                    const displayValue =
                      typeof stored === 'number' && stored > 0
                        ? useCm
                          ? formatNumber(inchesToCm(stored))
                          : formatNumber(stored)
                        : '';
                    const limits = MEASUREMENT_LIMITS[field];
                    const isInvalid =
                      typeof stored === 'number' && stored > 0 && (stored < limits.min || stored > limits.max);

                    return (
                      <div key={field} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 text-xs text-muted-foreground">
                          {MEASUREMENT_LABELS[field]}
                        </span>
                        <div className="relative w-36">
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            value={displayValue}
                            onChange={(event) => {
                              const raw = event.target.value;
                              if (!raw) {
                                onChange(size, field, undefined);
                                return;
                              }

                              const parsed = Number(raw);
                              if (!Number.isFinite(parsed) || parsed <= 0) {
                                onChange(size, field, undefined);
                                return;
                              }

                              const normalized = useCm ? cmToInches(parsed) : Math.round(parsed * 10) / 10;
                              onChange(size, field, normalized);
                            }}
                            className={cn('pr-9 text-xs', isInvalid && 'border-destructive')}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            {useCm ? 'cm' : 'in'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {outOfRange ? (
        <p className="text-[11px] text-destructive">
          Some values are outside typical garment ranges. Please verify measurements.
        </p>
      ) : null}
    </div>
  );
}
