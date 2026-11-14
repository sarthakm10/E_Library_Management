import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, BookCheck, BookUp, CheckCircle2, Loader2, Undo2, UserRound, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BookCover } from '@/components/book-cover'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { DataTable } from '@/components/ui/data-table'
import { Field, Input } from '@/components/ui/field'
import { Badge, Card, PageHeader } from '@/components/ui/misc'
import { ConfirmDialog } from '@/components/ui/modal'
import { api, errorMessage } from '@/lib/api'
import { DEFAULT_LOAN_DAYS } from '@/lib/constants'
import { useBooks, useIssues, useMembers } from '@/lib/queries'
import { cn, dueLabel, formatDate, initials, todayPlus } from '@/lib/utils'
import type { Book, Issue, IssueLookup, Member } from '@/lib/types'

type Filter = 'all' | 'overdue' | 'soon'

// Stable accessors for the pickers (module-level so their search results memoise properly).
const bookIdOf = (b: Book) => b.bookId
const bookNameOf = (b: Book) => b.bookName
const bookKeywords = (b: Book) => [b.authorName, b.publisherName, ...b.genres]
const memberIdOf = (m: Member) => m.memberId
const memberNameOf = (m: Member) => m.fullName
const memberKeywords = (m: Member) => [m.email, m.contactNo, m.city]

export default function IssuesPage() {
  const qc = useQueryClient()
  const { data: issues, isLoading } = useIssues()
  const [bookId, setBookId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [dueDate, setDueDate] = useState(todayPlus(DEFAULT_LOAN_DAYS))
  const [filter, setFilter] = useState<Filter>('all')
  const [returning, setReturning] = useState<Issue | null>(null)

  const { data: books, isLoading: loadingBooks } = useBooks()
  const { data: members, isLoading: loadingMembers } = useMembers()
  const related = useMemo(() => (issues ?? []).filter((i) =>
    (bookId && i.bookId === bookId) || (memberId && i.memberId === memberId)), [issues, bookId, memberId])

  // The pickers hand over exact IDs (no half-typed text), so the server check runs right away.
  const dBook = bookId
  const dMember = memberId
  const lookup = useQuery({
    queryKey: ['lookup', dBook, dMember],
    queryFn: () => api.get<IssueLookup>(`/api/admin/issues/lookup?bookId=${encodeURIComponent(dBook)}&memberId=${encodeURIComponent(dMember)}`),
    enabled: Boolean(dBook || dMember),
    staleTime: 0,
  })
  const info = dBook || dMember ? lookup.data : undefined
  const pendingLookup = lookup.isFetching || dBook !== bookId.trim() || dMember !== memberId.trim()

  const problem = (() => {
    if (!info || pendingLookup) return null
    if (dBook && !info.bookName) return 'No book with that ID'
    if (dMember && !info.memberName) return 'No member with that ID'
    if (info.available === 0) return 'No copies on the shelf'
    if (info.memberStatus && info.memberStatus !== 'active') return `Member account is ${info.memberStatus === 'deactive' ? 'deactivated' : 'pending approval'}`
    if (info.alreadyIssued) return 'This member already has this book'
    return null
  })()
  const canIssue = Boolean(info?.bookName && info?.memberName && !problem && !pendingLookup)

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['issues'] })
    qc.invalidateQueries({ queryKey: ['books'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    qc.invalidateQueries({ queryKey: ['lookup'] })
  }

  const issue = useMutation({
    mutationFn: () => api.post<Issue>('/api/admin/issues', { bookId: bookId.trim(), memberId: memberId.trim(), dueDate }),
    onSuccess: (i) => {
      toast.success(`Issued “${i.bookName}” to ${i.memberName}`, { description: `Due ${formatDate(i.dueDate)}` })
      setBookId('')
      refreshAll()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const doReturn = useMutation({
    mutationFn: (i: Issue) => api.post('/api/admin/issues/return', { bookId: i.bookId, memberId: i.memberId }),
    onSuccess: (_, i) => {
      toast.success(`“${i.bookName}” returned`)
      setReturning(null)
      refreshAll()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const counts = useMemo(() => ({
    all: issues?.length ?? 0,
    overdue: issues?.filter((i) => i.overdue).length ?? 0,
    soon: issues?.filter((i) => !i.overdue && i.daysLeft !== null && i.daysLeft <= 3).length ?? 0,
  }), [issues])

  const rows = useMemo(() => (issues ?? []).filter((i) =>
    filter === 'all' || (filter === 'overdue' ? i.overdue : !i.overdue && i.daysLeft !== null && i.daysLeft <= 3)), [issues, filter])

  const columns = useMemo<ColumnDef<Issue>[]>(() => [
    { accessorKey: 'bookName', header: 'Book', cell: ({ row }) => (
      <div><p className="font-medium">{row.original.bookName}</p><p className="font-mono text-xs text-muted">{row.original.bookId}</p></div>) },
    { accessorKey: 'memberName', header: 'Member', cell: ({ row }) => (
      <div><p className="font-medium">{row.original.memberName}</p><p className="font-mono text-xs text-muted">{row.original.memberId}</p></div>) },
    { accessorKey: 'issueDate', header: 'Issued', cell: ({ getValue }) => <span className="text-muted">{formatDate(getValue<string>())}</span> },
    { accessorKey: 'dueDate', header: 'Due', cell: ({ row }) => (
      <div className="space-y-1"><p>{formatDate(row.original.dueDate)}</p>
        <Badge tone={row.original.overdue ? 'danger' : (row.original.daysLeft ?? 99) <= 3 ? 'warning' : 'neutral'}>{dueLabel(row.original.daysLeft)}</Badge></div>) },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => (
      <div className="text-right"><Button size="sm" variant="outline" onClick={() => setReturning(row.original)}><Undo2 className="h-3.5 w-3.5" />Return</Button></div>) },
  ], [])

  return (
    <>
      <PageHeader title="Issue & return" description="Lend books to members and check them back in." />

      {/* Raised above the loans table: glass cards each form their own stacking context, so without this the picker dropdown would sit behind the table. */}
      <Card className="relative z-20 mb-6 p-5 sm:p-6">
        <form onSubmit={(e) => { e.preventDefault(); if (canIssue) issue.mutate() }} className="grid gap-4 lg:grid-cols-[1fr_1fr_200px_auto] lg:items-start">
          <Field label="Book" htmlFor="bookId">
            <Combobox id="bookId" value={bookId} onChange={setBookId} items={books} loading={loadingBooks}
              getId={bookIdOf} getName={bookNameOf} getKeywords={bookKeywords}
              placeholder="Title, author or ID…" emptyText="No book matches that"
              renderSelected={(b) => b.bookId}
              renderItem={(b) => (
                <div className="flex items-center gap-3">
                  <BookCover src={b.imageUrl} title={b.bookName} className="h-12 w-8 shrink-0 rounded-md text-[0px] [&_svg]:hidden" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.bookName}</p>
                    <p className="truncate text-xs text-muted">{b.authorName} · <span className="font-mono">{b.bookId}</span></p>
                  </div>
                  <Badge tone={b.currentStock > 0 ? 'success' : 'danger'}>{b.currentStock > 0 ? `${b.currentStock} on shelf` : 'All out'}</Badge>
                </div>
              )} />
            <LookupLine loading={pendingLookup && !!bookId} empty={!bookId} ok={info?.bookName}
              icon={BookCheck} detail={info?.available != null ? `${info.available} on shelf` : undefined} />
          </Field>
          <Field label="Member" htmlFor="memberId">
            <Combobox id="memberId" value={memberId} onChange={setMemberId} items={members} loading={loadingMembers}
              getId={memberIdOf} getName={memberNameOf} getKeywords={memberKeywords}
              placeholder="Name, ID, phone or email…" emptyText="No member matches that"
              renderSelected={(m) => m.memberId}
              renderItem={(m) => (
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan text-[11px] font-semibold text-accent-ink">{initials(m.fullName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.fullName}</p>
                    <p className="truncate text-xs text-muted"><span className="font-mono">{m.memberId}</span>{m.city && ` · ${m.city}`}{m.contactNo && ` · ${m.contactNo}`}</p>
                  </div>
                  {m.accountStatus !== 'active' && <Badge tone={m.accountStatus === 'pending' ? 'warning' : 'danger'}>{m.accountStatus === 'pending' ? 'Pending' : 'Deactivated'}</Badge>}
                </div>
              )} />
            <LookupLine loading={pendingLookup && !!memberId} empty={!memberId} ok={info?.memberName}
              icon={UserRound} detail={info?.memberStatus ?? undefined} />
          </Field>
          <Field label="Due date" htmlFor="dueDate">
            <Input id="dueDate" type="date" min={todayPlus(0)} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <div className="lg:pt-7">
            <Button type="submit" className="w-full lg:w-auto" size="lg" disabled={!canIssue} loading={issue.isPending}><BookUp className="h-4 w-4" />Issue book</Button>
          </div>
        </form>
        {problem && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"><XCircle className="h-4 w-4" />{problem}</p>
        )}

        {/* Returning is usually "this person / this book is back": show the matching loans right here. */}
        {(bookId || memberId) && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-[13px] font-medium text-muted">
              {related.length ? `On loan ${memberId && bookId ? 'for this member or book' : memberId ? 'to this member' : 'for this book'}` : `Nothing on loan ${memberId ? 'to this member' : 'for this book'}`}
            </p>
            {related.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {related.map((i) => (
                  <li key={`${i.memberId}-${i.bookId}`} className={cn('flex items-center justify-between gap-3 rounded-xl border px-3 py-2', i.overdue ? 'border-danger/30 bg-danger-soft/40' : 'border-border bg-surface-2/50')}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.bookName}</p>
                      <p className="truncate text-xs text-muted">{i.memberName} · due {formatDate(i.dueDate)} · <span className={i.overdue ? 'text-danger' : undefined}>{dueLabel(i.daysLeft)}</span></p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setReturning(i)}><Undo2 className="h-3.5 w-3.5" />Return</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search loans…"
        emptyTitle="No books are out"
        emptyText="Issued books will show up here."
        rowClassName={(r) => (r.original.overdue ? 'bg-danger-soft/40' : undefined)}
        toolbar={
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
            {([['all', 'All'], ['overdue', 'Overdue'], ['soon', 'Due soon']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors', filter === k ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}>
                {k === 'overdue' && counts.overdue > 0 && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}
                {label}<span className="text-xs text-muted">{counts[k]}</span>
              </button>
            ))}
          </div>
        }
      />

      <ConfirmDialog
        open={Boolean(returning)}
        title="Return this book?"
        message={returning && <>Mark <b className="text-ink">{returning.bookName}</b> as returned by <b className="text-ink">{returning.memberName}</b>.{returning.overdue && <> It is <b className="text-danger">{dueLabel(returning.daysLeft)}</b>.</>}</>}
        confirmLabel="Mark returned"
        loading={doReturn.isPending}
        onConfirm={() => returning && doReturn.mutate(returning)}
        onClose={() => setReturning(null)}
      />
    </>
  )
}

function LookupLine({ loading, empty, ok, icon: Icon, detail }: {
  loading: boolean; empty: boolean; ok?: string | null; icon: typeof BookCheck; detail?: string
}) {
  if (empty) return <p className="h-5 text-xs text-muted">&nbsp;</p>
  if (loading) return <p className="flex h-5 items-center gap-1.5 text-xs text-muted"><Loader2 className="h-3 w-3 animate-spin" />Looking up…</p>
  if (!ok) return <p className="flex h-5 items-center gap-1.5 text-xs text-danger"><XCircle className="h-3 w-3" />Not found</p>
  return (
    <p className="flex h-5 items-center gap-1.5 truncate text-xs text-success">
      <CheckCircle2 className="h-3 w-3 shrink-0" /><Icon className="h-3 w-3 shrink-0" /><span className="truncate font-medium">{ok}</span>
      {detail && <span className="text-muted">· {detail}</span>}
    </p>
  )
}
