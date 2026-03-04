'use client';

import { useCallback } from 'react';
import { ChevronDown, Copy, Palette, Trash2 } from 'lucide-react';

import type { ColorVariant, SizeKey } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { ImageDropzoneMock } from './image-dropzone-mock';
import { SizeChartPreview } from './size-chart-preview';
import { SizeMeasurementsInput } from './size-measurements';
import { SizeSelector } from './size-selector';
import { StockGrid } from './stock-grid';
import {
  type MeasurementField,
  normalizeColorHex,
  orderSizes,
} from './variant-helpers';

type CopySourceVariant = {
  id: string;
  colorName: string;
};

type VariantCardProps = {
  variant: ColorVariant;
  index: number;
  isOpen: boolean;
  canRemove: boolean;
  copySourceVariants: CopySourceVariant[];
  onToggleOpen: () => void;
  onUpdate: (updated: ColorVariant) => void;
  onRemove: () => void;
  onCopyMeasurements: (sourceVariantId: string) => void;
};

function hasMeasurements(variant: ColorVariant, size: SizeKey): boolean {
  const row = variant.measurements?.[size];
  if (!row) return false;

  return Object.values(row).some((value) => typeof value === 'number' && value > 0);
}

export function VariantCard({
  variant,
  index,
  isOpen,
  canRemove,
  copySourceVariants,
  onToggleOpen,
  onUpdate,
  onRemove,
  onCopyMeasurements,
}: VariantCardProps) {
  const handleSizeToggle = useCallback(
    (size: SizeKey) => {
      const isSelected = variant.selectedSizes.includes(size);

      if (isSelected) {
        const nextStock = { ...variant.stock };
        delete nextStock[size];

        const nextMeasurements = { ...(variant.measurements ?? {}) };
        delete nextMeasurements[size];

        onUpdate({
          ...variant,
          selectedSizes: variant.selectedSizes.filter((entry) => entry !== size),
          stock: nextStock,
          measurements: Object.keys(nextMeasurements).length ? nextMeasurements : undefined,
        });
        return;
      }

      onUpdate({
        ...variant,
        selectedSizes: orderSizes([...variant.selectedSizes, size]),
        stock: {
          ...variant.stock,
          [size]: variant.stock[size] ?? 0,
        },
      });
    },
    [onUpdate, variant]
  );

  const handleStockChange = useCallback(
    (size: SizeKey, quantity: number) => {
      onUpdate({
        ...variant,
        stock: {
          ...variant.stock,
          [size]: quantity,
        },
      });
    },
    [onUpdate, variant]
  );

  const handleMeasurementChange = useCallback(
    (size: SizeKey, field: MeasurementField, value: number | undefined) => {
      const currentSizeMeasurement = { ...(variant.measurements?.[size] ?? {}) };

      if (value === undefined) {
        delete currentSizeMeasurement[field];
      } else {
        currentSizeMeasurement[field] = value;
      }

      const nextMeasurements = { ...(variant.measurements ?? {}) };
      if (Object.keys(currentSizeMeasurement).length === 0) {
        delete nextMeasurements[size];
      } else {
        nextMeasurements[size] = currentSizeMeasurement;
      }

      onUpdate({
        ...variant,
        measurements: Object.keys(nextMeasurements).length ? nextMeasurements : undefined,
      });
    },
    [onUpdate, variant]
  );

  const displayName = variant.colorName.trim() || `Variant ${index + 1}`;
  const normalizedHex = normalizeColorHex(variant.colorHex);
  const totalStock = variant.selectedSizes.reduce((sum, size) => sum + (variant.stock[size] ?? 0), 0);
  const imageCount = variant.images.length;
  const measuredSizeCount = variant.selectedSizes.filter((size) => hasMeasurements(variant, size)).length;
  const missingStockSizes = variant.selectedSizes.filter((size) => (variant.stock[size] ?? 0) <= 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 sm:px-5"
      >
        <span
          className="size-5 shrink-0 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: normalizedHex }}
          aria-hidden="true"
        />

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>

          {variant.selectedSizes.length > 0 ? (
            <Badge variant="secondary" className="text-[10px]">
              {variant.selectedSizes.length} {variant.selectedSizes.length === 1 ? 'size' : 'sizes'}
            </Badge>
          ) : null}

          {imageCount > 0 ? (
            <Badge variant="secondary" className="text-[10px]">
              {imageCount} {imageCount === 1 ? 'image' : 'images'}
            </Badge>
          ) : null}

          {totalStock > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {totalStock} units
            </Badge>
          ) : null}
        </span>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen ? (
        <div className="space-y-5 border-t border-border px-4 py-5 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor={`color-name-${variant.id}`} className="flex items-center gap-2">
                <Palette className="size-3.5 text-muted-foreground" />
                Color name
              </Label>
              <Input
                id={`color-name-${variant.id}`}
                placeholder="e.g. Midnight Black"
                value={variant.colorName}
                onChange={(event) =>
                  onUpdate({
                    ...variant,
                    colorName: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`color-picker-${variant.id}`}>Swatch</Label>
              <div className="flex items-center gap-2">
                <label
                  className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border"
                  style={{ backgroundColor: normalizedHex }}
                >
                  <input
                    id={`color-picker-${variant.id}`}
                    type="color"
                    value={normalizedHex}
                    onChange={(event) =>
                      onUpdate({
                        ...variant,
                        colorHex: normalizeColorHex(event.target.value),
                      })
                    }
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <span className="sr-only">Pick color</span>
                </label>

                <Input
                  value={normalizedHex}
                  onChange={(event) =>
                    onUpdate({
                      ...variant,
                      colorHex: normalizeColorHex(event.target.value),
                    })
                  }
                  className="w-28 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Product images</Label>
            <ImageDropzoneMock
              imageUrls={variant.images}
              onAddUrl={(url) =>
                onUpdate({
                  ...variant,
                  images: [...variant.images, url],
                })
              }
              onRemoveUrl={(indexToRemove) =>
                onUpdate({
                  ...variant,
                  images: variant.images.filter((_, index) => index !== indexToRemove),
                })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Available sizes</Label>
            <p className="text-xs text-muted-foreground">
              Select which sizes are available for this color.
            </p>
            <SizeSelector selected={variant.selectedSizes} onToggle={handleSizeToggle} />
          </div>

          {variant.selectedSizes.length > 0 ? (
            <>
              <StockGrid
                sizes={variant.selectedSizes}
                stock={variant.stock}
                onChange={handleStockChange}
              />

              {missingStockSizes.length > 0 ? (
                <p className="text-xs text-amber-600">
                  Warning: {missingStockSizes.join(', ')} stock is currently 0.
                </p>
              ) : null}

              <div className="space-y-3">
                {copySourceVariants.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Copy measurements from:</span>
                    {copySourceVariants.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => onCopyMeasurements(source.id)}
                        className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        {source.colorName || 'Unnamed'}
                      </button>
                    ))}
                  </div>
                ) : null}

                <SizeMeasurementsInput
                  sizes={variant.selectedSizes}
                  measurements={variant.measurements}
                  onChange={handleMeasurementChange}
                />

                {measuredSizeCount > 0 ? (
                  <SizeChartPreview sizes={variant.selectedSizes} measurements={variant.measurements} />
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Choose at least one size to manage stock and measurements.
            </p>
          )}

          {canRemove ? (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Remove Variant
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
