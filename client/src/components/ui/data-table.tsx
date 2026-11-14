import { useState, type ReactNode } from 'react'
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type Row, type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react'
import { matchesAll } from '@/lib/search'
import { cn } from '@/lib/utils'
import { Card, EmptyState, Skeleton } from './misc'
import { Button } from './button'
import { Inbox } from 'lucide-react'

interface DataTableProps<T> {
  data: T[] | undefined
  columns: ColumnDef<T, any>[]
  loading?: boolean
  searchPlaceholder?: string
  toolbar?: ReactNode
  emptyTitle?: string
  emptyText?: string
  rowClassName?: (row: Row<T>) => string | undefined
  pageSize?: number
}

export function DataTable<T>({
  data, columns, loading, searchPlaceholder = 'Search…', toolbar, emptyTitle = 'Nothing here yet', emptyText, rowClassName, pageSize = 10,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    // Every word must appear somewhere in the row (any column, any order, accents ignored), e.g. "rahul potter".
    globalFilterFn: (row, _columnId, query: string) => matchesAll(query, Object.values(row.original as object)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const rows = table.getRowModel().rows
  const total = table.getFilteredRowModel().rows.length
  const { pageIndex } = table.getState().pagination

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-full border border-border bg-surface-2/60 pl-9 pr-3 text-sm transition-all placeholder:text-muted focus:border-accent/70 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
        </div>
        {toolbar}
      </div>

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort()
                  const dir = h.column.getIsSorted()
                  return (
                    <th key={h.id} className="whitespace-nowrap px-4 py-3 font-medium">
                      {h.isPlaceholder ? null : sortable ? (
                        <button className="inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide hover:text-ink" onClick={h.column.getToggleSortingHandler()}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{columns.map((_, j) => <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-full max-w-36" /></td>)}</tr>
                ))
              : rows.map((row) => (
                  <tr key={row.id} className={cn('transition-colors hover:bg-surface-2/70', rowClassName?.(row))}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState icon={Inbox} title={globalFilter ? 'No matches' : emptyTitle}>
            {globalFilter ? `Nothing matches “${globalFilter}”.` : emptyText}
          </EmptyState>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
          <span>
            {pageIndex * table.getState().pagination.pageSize + 1}–{Math.min(total, (pageIndex + 1) * table.getState().pagination.pageSize)} of {total}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </Card>
  )
}
