"use client";

import { cn } from "@/lib/utils";
import { ALL_SIZES, type Size, getSizeDisplayName } from "@/lib/product-types";

interface SizeSelectorProps {
  selected: Size[];
  onToggle: (size: Size) => void;
}

export function SizeSelector({ selected, onToggle }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_SIZES.map((size) => {
        const isActive = selected.includes(size);
        return (
          <button
            key={size}
            type="button"
            onClick={() => onToggle(size)}
            className={cn(
              "flex h-9 min-w-[3rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {getSizeDisplayName(size)}
          </button>
        );
      })}
    </div>
  );
}