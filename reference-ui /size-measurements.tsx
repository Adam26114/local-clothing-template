"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MEASUREMENT_FIELDS,
  inchesToCm,
  cmToInches,
  type MeasurementField,
  type Size,
  getSizeDisplayName,
  type SizeMeasurements as SizeMeasurementsType,
} from "@/lib/product-types";

const FIELD_LABELS: Record<MeasurementField, string> = {
  shoulder: "Shoulder",
  chest: "Chest",
  sleeve: "Sleeve",
  waist: "Waist",
  length: "Length",
};

const MEASUREMENT_LIMITS_INCHES: Record<MeasurementField, { min: number; max: number }> = {
  shoulder: { min: 10, max: 30 },
  chest: { min: 28, max: 60 },
  sleeve: { min: 5, max: 40 },
  waist: { min: 20, max: 56 },
  length: { min: 15, max: 45 },
};

interface SizeMeasurementsProps {
  sizes: Size[];
  measurements: Partial<Record<Size, SizeMeasurementsType>>;
  onChange: (size: Size, field: MeasurementField, value: number | undefined) => void;
}

function MeasurementInput({
  value,
  onChange,
  useCm,
  isOutOfRange,
}: {
  value: number | undefined;
  onChange: (val: string) => void;
  useCm: boolean;
  isOutOfRange: boolean;
}) {
  const [localValue, setLocalValue] = useState<string>("");

  useEffect(() => {
    if (value === undefined || value === 0) {
      setLocalValue("");
      return;
    }
    const targetVal = useCm ? inchesToCm(value) : value;
    const currentNum = parseFloat(localValue);
    const targetRounded = Math.round(targetVal * 10) / 10;

    if (isNaN(currentNum) || Math.round(currentNum * 10) / 10 !== targetRounded) {
      setLocalValue(String(targetRounded));
    }
  }, [value, useCm]);

  return (
    <Input
      type="number"
      step="0.1"
      min={0}
      placeholder="--"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      className={cn(
        "h-8 bg-secondary text-foreground pr-10 text-xs text-center",
        isOutOfRange && "border-destructive focus-visible:ring-destructive"
      )}
    />
  );
}

export function SizeMeasurementsInput({
  sizes,
  measurements,
  onChange,
}: SizeMeasurementsProps) {
  const [expandedSize, setExpandedSize] = useState<Size | null>(
    sizes.length > 0 ? sizes[0] : null
  );
  const [useCm, setUseCm] = useState(false);

  if (sizes.length === 0) return null;

  const handleValueChange = (
    size: Size,
    field: MeasurementField,
    rawValue: string,
    isCmInput: boolean
  ) => {
    if (rawValue === "") {
      onChange(size, field, undefined);
      return;
    }

    const num = parseFloat(rawValue);
    if (isNaN(num)) return;

    // Round to 1 decimal place
    const rounded = Math.round(num * 10) / 10;

    // Convert to inches for storage
    const valueInInches = isCmInput ? cmToInches(rounded) : rounded;
    onChange(size, field, valueInInches);
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ruler className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Size chart
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider">
          <button
            type="button"
            onClick={() => setUseCm(false)}
            className={cn(
              "uppercase transition-all pb-0.5",
              !useCm
                ? "text-foreground border-b border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            IN
          </button>
          <button
            type="button"
            onClick={() => setUseCm(true)}
            className={cn(
              "uppercase transition-all pb-0.5",
              useCm
                ? "text-foreground border-b border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            CM
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {sizes.map((size) => {
          const isExpanded = expandedSize === size;
          const sizeMeasurements = measurements[size] ?? {};
          const filledCount = MEASUREMENT_FIELDS.filter(
            (f) => sizeMeasurements[f] !== undefined && sizeMeasurements[f] !== 0
          ).length;

          return (
            <div key={size} className="overflow-hidden rounded-md border border-border bg-card">
              <button
                type="button"
                onClick={() => setExpandedSize(isExpanded ? null : size)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              >
                <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                  {getSizeDisplayName(size)}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {filledCount === 0
                    ? "No measurements"
                    : `${filledCount}/${MEASUREMENT_FIELDS.length} filled`}
                </span>
                {filledCount === MEASUREMENT_FIELDS.length && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border px-3 py-3">
                  <div className="flex flex-col gap-2">
                    {MEASUREMENT_FIELDS.map((field) => {
                      const value = sizeMeasurements[field];
                      const limits = MEASUREMENT_LIMITS_INCHES[field];
                      const isOutOfRange =
                        value !== undefined &&
                        value !== 0 &&
                        (value < limits.min || value > limits.max);

                      return (
                        <div
                          key={field}
                          className="flex items-center gap-2"
                        >
                          <span className="w-14 shrink-0 text-xs text-muted-foreground text-right">
                            {FIELD_LABELS[field]}
                          </span>
                          <div className="relative flex-1 max-w-[140px]">
                            <MeasurementInput
                              value={value}
                              onChange={(val) => handleValueChange(size, field, val, useCm)}
                              useCm={useCm}
                              isOutOfRange={isOutOfRange ?? false}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                              {useCm ? "cm" : "in"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {MEASUREMENT_FIELDS.some((f) => {
                    const v = sizeMeasurements[f];
                    const lim = MEASUREMENT_LIMITS_INCHES[f];
                    return v !== undefined && v !== 0 && (v < lim.min || v > lim.max);
                  }) && (
                    <p className="mt-2 text-[10px] text-destructive">
                      Some values are outside typical ranges. Please verify.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}