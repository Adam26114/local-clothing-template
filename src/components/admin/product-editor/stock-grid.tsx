'use client';

import type { SizeKey } from '@/lib/types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { getSizeDisplayName } from './variant-helpers';

type StockGridProps = {
  sizes: SizeKey[];
  stock: Partial<Record<SizeKey, number>>;
  onChange: (size: SizeKey, quantity: number) => void;
};

export function StockGrid({ sizes, stock, onChange }: StockGridProps) {
  return (
    <div className="space-y-2">
      <Label>Stock by size</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sizes.map((size) => (
          <div key={size} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{getSizeDisplayName(size)}</Label>
            <Input
              type="number"
              min={0}
              value={stock[size] ?? 0}
              onChange={(event) => {
                const raw = Number(event.target.value);
                const quantity = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
                onChange(size, quantity);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
