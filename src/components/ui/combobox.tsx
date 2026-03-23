'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
  value: string;
  label: string;
};

export type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
  showChevron?: boolean;
};

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  className,
  triggerClassName,
  contentClassName,
  align = 'start',
  showChevron = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-fit justify-between px-3 font-normal',
            className,
            triggerClassName
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          {showChevron ? <ChevronDown className="size-4 shrink-0 opacity-50" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[220px] p-0', contentClassName)} align={align}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn('size-4', value === option.value ? 'opacity-100' : 'opacity-0')}
                />
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
