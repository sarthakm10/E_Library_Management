import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, IndianRupee, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Badge, Card, PageHeader } from '@/components/ui/misc'
import { api, errorMessage } from '@/lib/api'
import { keys, useHistory } from '@/lib/queries'
import { cn, currency, formatDate } from '@/lib/utils'
import type { HistoryEntry } from '@/lib/types'

type Filter = 'all' | 'late' | 'unpaid'

export default function HistoryPage() {
  const qc = useQueryClient()
  const { data: history, isLoading } = useHistory()
  const [filter, setFilter] = useState<Filter>('all')

  const setPaid = useMutation({
    mutationFn: ({ entry, paid }: { entry: HistoryEntry; paid: boolean }) => api.patch(`/api/admin/history/${entry.id}/paid`, { paid }),
    onSuccess: (_, { entry, paid }) => {
      toast.success(paid ? `${currency.format(entry.fine)} from ${entry.memberName} marked paid` : 'Marked unpaid again')
      qc.invalidateQueries({ queryKey: keys.history })
      qc.invalidateQueries({ queryKey: ['lookup'] })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const stats = useMemo(() => {
    const list = history ?? []
    const unpaid = list.filter((h) => h.fine > 0 && !h.finePaid)
    return {
      all: list.length,
      late: list.filter((h) => h.daysLate > 0).length,
      unpaid: unpaid.length,
      owed: unpaid.reduce((s, h) => s + h.fine, 0),
      collected: list.filter((h) => h.finePaid).reduce((s, h) => s + h.fine, 0),
      owers: new Set(unpaid.map((h) => h.memberId)).size,
    }
  }, [history])

  const rows = useMemo(() => (history ?? []).filter((h) =>
    filter === 'all' || (filter === 'late' ? h.daysLate > 0 : h.fine > 0 && !h.finePaid)), [history, filter])

  const columns = useMemo<ColumnDef<HistoryEntry>[]>(() => [
    { accessorKey: 'bookName', header: 'Book', cell: ({ row }) => (
      <div><p className="font-medium">{row.original.bookName}</p><p className="font-mono text-xs text-muted">{row.original.bookId}</p></div>) },
    { accessorKey: 'memberName', header: 'Member', cell: ({ row }) => (
      <div><p className="font-medium">{row.original.memberName}</p><p className="font-mono text-xs text-muted">{row.original.memberId}</p></div>) },
    { accessorKey: 'issueDate', header: 'Borrowed', cell: ({ getValue }) => <span className="text-muted">{formatDate(getValue<string>())}</span> },
    { accessorKey: 'returnDate', header: 'Returned', cell: ({ row }) => (
      <div className="space-y-1">
        <p>{formatDate(row.original.returnDate)}</p>
        {row.original.daysLate > 0
          ? <Badge tone="warning">{row.original.daysLate} day{row.original.daysLate === 1 ? '' : 's'} late</Badge>
          : <Badge tone="success">On time</Badge>}
      </div>) },
    { accessorKey: 'renewCount', header: 'Renewed', cell: ({ getValue }) => <span className="text-muted">{getValue<number>() ? `${getValue<number>()}×` : '—'}</span> },
    { accessorKey: 'fine', header: 'Fine', cell: ({ row: { original: h } }) => h.fine > 0
      ? <Badge tone={h.finePaid ? 'neutral' : 'danger'}>{currency.format(h.fine)} {h.finePaid ? 'paid' : 'unpaid'}</Badge>
      : <span className="text-muted">—</span> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row: { original: h } }) => h.fine > 0 && (
      <div className="text-right">
        {h.finePaid
          ? <Button size="sm" variant="ghost" onClick={() => setPaid.mutate({ entry: h, paid: false })}><Undo2 className="h-3.5 w-3.5" />Undo</Button>
          : <Button size="sm" variant="outline" onClick={() => setPaid.mutate({ entry: h, paid: true })}><CheckCircle2 className="h-3.5 w-3.5" />Mark paid</Button>}
      </div>) },
  ], [setPaid.mutate])

  return (
    <>
      <PageHeader title="History & fines" description="Every returned loan, with late fines and whether they've been paid." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Unpaid fines" value={currency.format(stats.owed)} hint={`${stats.owers} member${stats.owers === 1 ? '' : 's'} owe`} tone="danger" />
        <Stat label="Collected" value={currency.format(stats.collected)} hint="Fines marked paid" />
        <Stat label="Returned late" value={String(stats.late)} hint={`of ${stats.all} returns`} />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search by book or member…"
        emptyTitle={filter === 'unpaid' ? 'No unpaid fines' : 'No returns yet'}
        emptyText={filter === 'unpaid' ? 'Everyone is paid up.' : 'Returned books will show up here.'}
        rowClassName={(r) => (r.original.fine > 0 && !r.original.finePaid ? 'bg-danger-soft/40' : undefined)}
        toolbar={
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
            {([['all', 'All'], ['late', 'Late'], ['unpaid', 'Unpaid']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors', filter === k ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}>
                {k === 'unpaid' && stats.unpaid > 0 && <IndianRupee className="h-3.5 w-3.5 text-danger" />}
                {label}<span className="text-xs text-muted">{stats[k]}</span>
              </button>
            ))}
          </div>
        }
      />
    </>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: 'danger' }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className={cn('mt-1 text-3xl font-semibold tracking-tight', tone === 'danger' && value !== currency.format(0) && 'text-danger')}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  )
}
