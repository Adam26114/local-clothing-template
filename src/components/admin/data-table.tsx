'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  type LucideIcon,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Plus,
  Search,
  GripVertical,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiCombobox, type MultiComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AdminDataTableProps<TData, TValue> = {
  tableId: string;
  columns: Array<ColumnDef<TData, TValue>>;
  data: TData[];
  searchPlaceholder?: string;
  defaultPageSize?: number;
  rowsPerPage?: number[];
  toolbar?: React.ReactNode;
  globalFilterDebounceMs?: number;
  onSelectedRowsChange?: (rows: TData[]) => void;
  variant?: 'default' | 'dashboard';
  showTabs?: boolean;
  dashboardTabs?: Array<{ value: string; label: string; badge?: number }>;
  enableRowDrag?: boolean;
  getRowId?: (row: TData, index: number) => string;
  onRowOrderChange?: (rows: TData[]) => void;
  showColumnsButton?: boolean;
  showAddButton?: boolean;
  addButtonLabel?: string;
  addButtonIcon?: LucideIcon;
  onAddClick?: () => void;
};

const DEFAULT_DASHBOARD_TABS = [
  { value: 'outline', label: 'Outline' },
  { value: 'past-performance', label: 'Past Performance', badge: 3 },
  { value: 'orders', label: 'Orders', badge: 2 },
  { value: 'focus-items', label: 'Focus Items' },
];

export function withRowSelection<TData, TValue>(
  columns: Array<ColumnDef<TData, TValue>>
): Array<ColumnDef<TData, TValue>> {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
        />
      ),
      enableHiding: false,
      enableSorting: false,
    },
    ...columns,
  ];
}

export function AdminDataTable<TData, TValue>({
  tableId,
  columns,
  data,
  searchPlaceholder = 'Search...',
  defaultPageSize = 20,
  rowsPerPage = [10, 20, 50, 100],
  toolbar,
  globalFilterDebounceMs = 300,
  onSelectedRowsChange,
  variant = 'default',
  showTabs = false,
  dashboardTabs = DEFAULT_DASHBOARD_TABS,
  enableRowDrag = false,
  getRowId,
  onRowOrderChange,
  showColumnsButton = true,
  showAddButton = true,
  addButtonLabel = 'Add',
  addButtonIcon: AddButtonIcon = Plus,
  onAddClick,
}: AdminDataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const firstDashboardTab = dashboardTabs[0]?.value ?? 'outline';
  const [dashboardTab, setDashboardTab] = React.useState(firstDashboardTab);

  React.useEffect(() => {
    if (!dashboardTabs.some((tab) => tab.value === dashboardTab)) {
      setDashboardTab(firstDashboardTab);
    }
  }, [dashboardTabs, dashboardTab, firstDashboardTab]);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(`khit_columns_${tableId}`);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setColumnVisibility(parsed as VisibilityState);
      } else {
        window.localStorage.removeItem(`khit_columns_${tableId}`);
      }
    } catch {
      window.localStorage.removeItem(`khit_columns_${tableId}`);
    }
  }, [tableId]);

  React.useEffect(() => {
    window.localStorage.setItem(`khit_columns_${tableId}`, JSON.stringify(columnVisibility));
  }, [tableId, columnVisibility]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setGlobalFilter(searchInput);
    }, globalFilterDebounceMs);

    return () => window.clearTimeout(timer);
  }, [globalFilterDebounceMs, searchInput]);

  const workingColumns = React.useMemo<Array<ColumnDef<TData, TValue>>>(() => {
    if (!enableRowDrag) return columns;

    const dragColumn: ColumnDef<TData, TValue> = {
      id: '__drag',
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.id} />,
      enableHiding: false,
      enableSorting: false,
    };

    return [dragColumn, ...columns];
  }, [columns, enableRowDrag]);

  const resolvedGetRowId = React.useCallback(
    (row: TData, index: number) => getRowId?.(row, index) ?? String(index),
    [getRowId]
  );

  const table = useReactTable({
    data: tableData,
    columns: workingColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: resolvedGetRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  React.useEffect(() => {
    if (!onSelectedRowsChange) return;
    const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
    onSelectedRowsChange(selected);
  }, [onSelectedRowsChange, rowSelection, table, tableData]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => {
    return tableData.map((row, index) => resolvedGetRowId(row, index));
  }, [resolvedGetRowId, tableData]);

  const sortableId = React.useId();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setTableData((currentData) => {
      const oldIndex = currentData.findIndex(
        (row, index) => resolvedGetRowId(row, index) === String(active.id)
      );
      const newIndex = currentData.findIndex(
        (row, index) => resolvedGetRowId(row, index) === String(over.id)
      );
      if (oldIndex < 0 || newIndex < 0) return currentData;
      const nextData = arrayMove(currentData, oldIndex, newIndex);
      onRowOrderChange?.(nextData);
      return nextData;
    });
  }

  const columnOptions = React.useMemo<MultiComboboxOption[]>(
    () =>
      table
        .getAllColumns()
        .filter((column) => column.getCanHide())
        .map((column) => {
          const header = column.columnDef.header;
          const label =
            typeof header === 'string'
              ? header
              : typeof column.id === 'string'
                ? column.id
                : 'Column';

          return {
            value: column.id,
            label,
          };
        }),
    [table]
  );

  const visibleColumnIds = React.useMemo(
    () =>
      columnOptions
        .filter((option) => table.getColumn(option.value)?.getIsVisible())
        .map((option) => option.value),
    [columnOptions, table]
  );

  const searchAndFilterRow = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="pl-9"
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="flex items-center gap-2">
        {toolbar}
        {showColumnsButton ? (
          <MultiCombobox
            values={visibleColumnIds}
            onValuesChange={(values) => {
              const nextVisibility = Object.fromEntries(
                columnOptions.map((option) => [option.value, values.includes(option.value)])
              ) as VisibilityState;
              setColumnVisibility(nextVisibility);
            }}
            options={columnOptions}
            placeholder="Columns"
            triggerLabel="Column"
            triggerIcon={<Columns3 className="size-4" />}
            triggerClassName="w-fit justify-start"
            contentClassName="w-fit min-w-40"
            align="end"
          />
        ) : null}
        {showAddButton ? (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onAddClick}
          >
            <AddButtonIcon className="size-4" />
            {addButtonLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const tableNode = (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} aria-sort={getAriaSort(header.column.getIsSorted())}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 gap-1 px-2 font-medium hover:bg-transparent"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {getSortIcon(header.column.getIsSorted())}
                    </Button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {table.getRowModel().rows.length > 0 ? (
            enableRowDrag ? (
              <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow data-state={row.getIsSelected() ? 'selected' : undefined} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )
          ) : (
            <TableRow>
              <TableCell colSpan={workingColumns.length + 1} className="h-24 text-center text-zinc-500">
                No rows found. Try clearing filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const tableNodeWithDnD = enableRowDrag ? (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      id={sortableId}
    >
      {tableNode}
    </DndContext>
  ) : (
    tableNode
  );

  const paginationNode = (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
        selected.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor={`${tableId}-rows-per-page`} className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20" id={`${tableId}-rows-per-page`}>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {rowsPerPage.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const shouldRenderTabs = showTabs || variant === 'dashboard';

  if (shouldRenderTabs) {
    return (
      <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="w-full flex-col justify-start gap-4">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor={`${tableId}-view-selector`} className="sr-only">
            View
          </Label>
          <Select value={dashboardTab} onValueChange={setDashboardTab}>
            <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id={`${tableId}-view-selector`}>
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              {dashboardTabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            {dashboardTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.badge ? <Badge variant="secondary">{tab.badge}</Badge> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <div />
        </div>

        <TabsContent
          value={firstDashboardTab}
          className="relative flex flex-col gap-4 overflow-auto px-4 pt-1 lg:px-6"
        >
          {searchAndFilterRow}
          {tableNodeWithDnD}
          {paginationNode}
        </TabsContent>

        {dashboardTabs.slice(1).map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="flex flex-col px-4 lg:px-6">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {searchAndFilterRow}
      {tableNodeWithDnD}
      {paginationNode}
    </div>
  );
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 cursor-grab touch-none select-none hover:bg-transparent active:cursor-grabbing"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function getSortIcon(sorted: false | 'asc' | 'desc') {
  if (sorted === 'asc') {
    return <ArrowUp className="size-4" />;
  }

  if (sorted === 'desc') {
    return <ArrowDown className="size-4" />;
  }

  return <ArrowUpDown className="text-muted-foreground size-4" />;
}

function getAriaSort(sorted: false | 'asc' | 'desc') {
  if (sorted === 'asc') return 'ascending';
  if (sorted === 'desc') return 'descending';
  return 'none';
}

function DraggableRow<TData>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() ? 'selected' : undefined}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  );
}
