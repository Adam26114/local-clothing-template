'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  listInventoryAuditLogsAction,
  updateInventoryStockAction,
} from '@/app/(admin)/admin/inventory/actions';
import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InventoryRow } from '@/lib/data/repositories/types';
import type { InventoryAuditLog } from '@/lib/types';

type InventoryTableProps = {
  initialRows: InventoryRow[];
};

function rowKey(row: Pick<InventoryRow, 'productId' | 'variantId' | 'size'>): string {
  return `${row.productId}::${row.variantId}::${row.size}`;
}

export function InventoryTable({ initialRows }: InventoryTableProps) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRows);
  const [lowOnly, setLowOnly] = useState(false);
  const [outOnly, setOutOnly] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [selectedRows, setSelectedRows] = useState<InventoryRow[]>([]);
  const [logTarget, setLogTarget] = useState<InventoryRow | null>(null);
  const [logs, setLogs] = useState<InventoryAuditLog[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingLogs, startLogsTransition] = useTransition();

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (outOnly) return row.stock === 0;
      if (lowOnly) return row.stock < 5;
      return true;
    });
  }, [rows, lowOnly, outOnly]);

  const commitStock = (row: InventoryRow, nextValue: number) => {
    const normalized = Math.max(0, Math.floor(nextValue));
    if (normalized === row.stock) {
      return;
    }

    startTransition(async () => {
      const result = await updateInventoryStockAction({
        productId: row.productId,
        variantId: row.variantId,
        size: row.size,
        newValue: normalized,
      });

      if (!result.ok) {
        toast.error(result.error);
        setEditingValues((prev) => ({
          ...prev,
          [rowKey(row)]: row.stock,
        }));
        return;
      }

      setRows((prev) =>
        prev.map((entry) =>
          rowKey(entry) === rowKey(row)
            ? {
                ...entry,
                stock: result.data.row.stock,
              }
            : entry
        )
      );

      setEditingValues((prev) => ({
        ...prev,
        [rowKey(row)]: result.data.row.stock,
      }));

      if (logTarget && rowKey(logTarget) === rowKey(row)) {
        setLogs((prev) => [result.data.log, ...prev]);
      }

      toast.success('Stock updated.');
    });
  };

  const openLogs = (row: InventoryRow) => {
    setLogTarget(row);
    startLogsTransition(async () => {
      const result = await listInventoryAuditLogsAction({
        productId: row.productId,
        variantId: row.variantId,
        size: row.size,
        limit: 20,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setLogs(result.data);
    });
  };

  const columns: Array<ColumnDef<InventoryRow>> = [
    { accessorKey: 'productName', header: 'Product' },
    { accessorKey: 'colorName', header: 'Variant (Color)' },
    { accessorKey: 'size', header: 'Size' },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
          {row.original.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock Quantity',
      cell: ({ row }) => {
        const key = rowKey(row.original);
        const value = editingValues[key] ?? row.original.stock;

        return (
          <input
            type="number"
            min={0}
            className="w-20 rounded border px-2 py-1 text-sm"
            value={value}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setEditingValues((prev) => ({
                ...prev,
                [key]: Number.isFinite(parsed) ? parsed : 0,
              }));
            }}
            onBlur={() => commitStock(row.original, value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => openLogs(row.original)}>
          View Logs
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(event) => {
              setLowOnly(event.target.checked);
              if (event.target.checked) setOutOnly(false);
            }}
          />
          Low stock (&lt; 5)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={outOnly}
            onChange={(event) => {
              setOutOnly(event.target.checked);
              if (event.target.checked) setLowOnly(false);
            }}
          />
          Out of stock (= 0)
        </label>
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-zinc-500">
            <Loader2 className="size-4 animate-spin" /> Saving stock...
          </span>
        ) : null}
      </div>

      <AdminDataTable
        tableId="inventory"
        columns={withRowSelection(columns)}
        data={filteredRows}
        searchPlaceholder="Search product or color"
        defaultPageSize={50}
        onSelectedRowsChange={setSelectedRows}
        toolbar={
          selectedRows.length > 0 ? (
            <span className="text-sm text-zinc-600">{selectedRows.length} selected</span>
          ) : null
        }
      />

      {logTarget ? (
        <section className="rounded border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Stock Audit Logs</h3>
              <p className="text-sm text-zinc-600">
                {logTarget.productName} · {logTarget.colorName} · {logTarget.size}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLogTarget(null)}>
              Close
            </Button>
          </div>

          {isLoadingLogs ? (
            <p className="text-sm text-zinc-500">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No stock updates yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log._id} className="rounded border p-2">
                  <p>
                    <span className="font-medium">{log.oldValue}</span> →{' '}
                    <span className="font-medium">{log.newValue}</span>
                  </p>
                  <p className="text-zinc-600">By {log.changedBy}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(log.changedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
