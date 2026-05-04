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
  icon?: React.ReactNode;
};

export type MultiComboboxOption = ComboboxOption;

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
  triggerIcon?: React.ReactNode;
  triggerPrefix?: string;
};

export type MultiComboboxProps = {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: MultiComboboxOption[];
  placeholder: string;
  triggerLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
  triggerIcon?: React.ReactNode;
  triggerPrefix?: string;
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
  triggerIcon,
  triggerPrefix,
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
            'h-9 w-fit justify-between gap-2 px-3 font-normal',
            className,
            triggerClassName
          )}
        >
          {triggerIcon ? <span className="text-muted-foreground">{triggerIcon}</span> : null}
          {triggerPrefix ? (
            <span className="text-sm text-muted-foreground">{triggerPrefix}</span>
          ) : null}
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
                {option.icon ? <span className="text-muted-foreground">{option.icon}</span> : null}
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MultiCombobox({
  values,
  onValuesChange,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  className,
  triggerClassName,
  contentClassName,
  align = 'start',
  triggerLabel,
  triggerIcon,
  triggerPrefix,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const displayLabel =
    triggerLabel ??
    (selectedOptions.length > 0
      ? selectedOptions.map((option) => option.label).join(', ')
      : placeholder);

  const toggleValue = (nextValue: string) => {
    if (values.includes(nextValue)) {
      onValuesChange(values.filter((value) => value !== nextValue));
      return;
    }

    onValuesChange([...values, nextValue]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-fit justify-between gap-2 px-3 font-normal',
            className,
            triggerClassName
          )}
        >
          {triggerIcon ? <span className="text-muted-foreground">{triggerIcon}</span> : null}
          {triggerPrefix ? (
            <span className="text-sm text-muted-foreground">{triggerPrefix}</span>
          ) : null}
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-fit p-0', contentClassName)} align={align}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {options.map((option) => {
              const checked = values.includes(option.value);

              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggleValue(option.value)}
                >
                  <Check className={cn('size-4', checked ? 'opacity-100' : 'opacity-0')} />
                  {option.icon ? <span className="text-muted-foreground">{option.icon}</span> : null}
                  <span>{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
