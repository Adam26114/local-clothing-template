"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Size, getSizeDisplayName } from "@/lib/product-types";

interface StockGridProps {
  sizes: Size[];
  stock: Partial<Record<Size, number>>;
  onChange: (size: Size, qty: number) => void;
}

export function StockGrid({ sizes, stock, onChange }: StockGridProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Stock by size</Label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {sizes.map((size) => (
          <div key={size} className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{getSizeDisplayName(size)}</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={stock[size] ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const qty = val === "" ? 0 : parseInt(val, 10);
                onChange(size, isNaN(qty) ? 0 : qty);
              }}
              className="h-8 bg-secondary text-foreground text-center"
            />
          </div>
        ))}
      </div>
    </div>
  );
}