import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMmk } from '@/lib/currency';
import type { DashboardKpi } from '@/lib/data/repositories/types';

export function DashboardKpis({ kpis }: { kpis: DashboardKpi }) {
  const cards: Array<{
    title: string;
    value: string;
    helper: string;
    subtext: string;
    trend: string;
    down?: boolean;
  }> = [
    {
      title: 'Total Revenue',
      value: formatMmk(kpis.totalRevenueMmk),
      helper: 'Trending up this month',
      subtext: 'Total from completed order flow',
      trend: '+12.5%',
    },
    {
      title: 'Pending Orders',
      value: String(kpis.pendingOrders),
      helper: 'Down 20% this period',
      subtext: 'Acquisition needs attention',
      trend: '-20%',
      down: true,
    },
    {
      title: 'Active Products',
      value: String(kpis.activeProducts),
      helper: 'Strong catalog retention',
      subtext: 'Published SKUs available now',
      trend: '+12.5%',
    },
    {
      title: 'Active Accounts',
      value: String(kpis.activeAccounts),
      helper: 'Steady performance increase',
      subtext: 'Meets growth projections',
      trend: '+4.5%',
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.down ? <IconTrendingDown /> : <IconTrendingUp />}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.helper}
              {card.down ? <IconTrendingDown className="size-4" /> : <IconTrendingUp className="size-4" />}
            </div>
            <div className="text-muted-foreground">{card.subtext}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
