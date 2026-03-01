'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId().replace(/:/g, '');
  const chartId = `chart-${id ?? uniqueId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-text]:fill-muted-foreground aspect-video flex justify-center text-xs',
          className
        )}
        style={
          Object.fromEntries(
            Object.entries(config)
              .filter(([, item]) => Boolean(item.color))
              .map(([key, item]) => [`--color-${key}`, item.color as string])
          ) as React.CSSProperties
        }
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

type ChartTooltipContentProps = React.ComponentProps<'div'> & {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    name?: string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string | number;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'dot' | 'line';
  labelFormatter?: (label: string | number) => React.ReactNode;
  formatter?: (value: number | string, name: string) => React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = 'dot',
  labelFormatter,
  formatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-background/95 grid min-w-36 gap-1 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm',
        className
      )}
    >
      {!hideLabel ? (
        <div className="text-muted-foreground font-medium">
          {labelFormatter ? labelFormatter(label ?? '') : label}
        </div>
      ) : null}
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.name ?? index);
        const conf = config[key];
        const itemLabel = conf?.label ?? item.name ?? key;
        const value = item.value ?? 0;

        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              {hideIndicator ? null : indicator === 'dot' ? (
                <span className="size-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
              ) : (
                <span className="h-0.5 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              )}
              <span>{itemLabel}</span>
            </div>
            <span className="text-foreground font-medium tabular-nums">
              {formatter ? formatter(value, itemLabel) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, useChart };
