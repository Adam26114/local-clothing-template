'use client';

import type { SizeKey } from '@/lib/types';

import { cn } from '@/lib/utils';

import { SIZE_OPTIONS, getSizeDisplayName } from './variant-helpers';

type SizeSelectorProps = {
  selected: SizeKey[];
  onToggle: (size: SizeKey) => void;
};

export function SizeSelector({ selected, onToggle }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIZE_OPTIONS.map((size) => {
        const isActive = selected.includes(size);

        return (
          <button
            key={size}
            type="button"
            onClick={() => onToggle(size)}
            className={cn(
              'flex h-10 min-w-14 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {getSizeDisplayName(size)}
          </button>
        );
      })}
    </div>
  );
}
