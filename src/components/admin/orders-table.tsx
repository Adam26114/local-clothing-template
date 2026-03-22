'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ORDER_STATUSES } from '@/lib/constants';
import { formatMmk } from '@/lib/currency';
import { Order, OrderStatus } from '@/lib/types';

export function OrdersTable({
  initialOrders,
  showStatusFilter = true,
}: {
  initialOrders: Order[];
  showStatusFilter?: boolean;
}) {
  const [status, setStatus] = useState<'all' | OrderStatus>('all');

  const filteredData = useMemo(() => {
    if (status === 'all') return initialOrders;
    return initialOrders.filter((item) => item.status === status);
  }, [status, initialOrders]);

  const columns: Array<ColumnDef<Order>> = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <Link
          href={`/admin/orders/${row.original._id}`}
          className="font-medium underline-offset-2 hover:underline"
        >
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'customerInfo.name',
      header: 'Customer',
      cell: ({ row }) => row.original.customerInfo.name,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => formatMmk(row.original.total),
    },
    {
      accessorKey: 'deliveryMethod',
      header: 'Delivery',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/orders/${row.original._id}`}>Manage</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {showStatusFilter ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <select
            className="rounded border bg-white px-3 py-1 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | OrderStatus)}
          >
            <option value="all">All</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <AdminDataTable
        tableId="orders"
        columns={withRowSelection(columns)}
        data={filteredData}
        searchPlaceholder="Search by order #, customer, phone, email"
        showTabs={!showStatusFilter}
        variant={showStatusFilter ? 'default' : 'dashboard'}
        enableRowDrag={!showStatusFilter}
        getRowId={(row) => row._id}
      />
    </div>
  );
}
