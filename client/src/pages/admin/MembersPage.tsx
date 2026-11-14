import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Ban, CheckCircle2, Clock, Eye, Mail, MapPin, Phone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Badge, PageHeader, Skeleton, StatusBadge } from '@/components/ui/misc'
import { ConfirmDialog, Modal } from '@/components/ui/modal'
import { api, errorMessage } from '@/lib/api'
import { useIssues, useMembers } from '@/lib/queries'
import { cn, dueLabel, formatDate, initials } from '@/lib/utils'
import type { AccountStatus, Member } from '@/lib/types'

type Filter = 'all' | AccountStatus

export default function MembersPage() {
  const { data: members, isLoading } = useMembers()
  const { data: issues } = useIssues()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [viewing, setViewing] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState<Member | null>(null)

  const loans = useMemo(() => {
    const map = new Map<string, number>()
    issues?.forEach((i) => map.set(i.memberId, (map.get(i.memberId) ?? 0) + 1))
    return map
  }, [issues])

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) => api.patch<Member>(`/api/admin/members/${encodeURIComponent(id)}/status`, { status }),
    onSuccess: (m) => {
      toast.success(`${m.fullName} is now ${m.accountStatus === 'deactive' ? 'deactivated' : m.accountStatus}`)
      qc.invalidateQueries({ queryKey: ['members'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setViewing((v) => (v?.memberId === m.memberId ? m : v))
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (m: Member) => api.del(`/api/admin/members/${encodeURIComponent(m.memberId)}`),
    onSuccess: (_, m) => {
      toast.success(`Removed ${m.fullName}`)
      setDeleting(null)
      setViewing(null)
      qc.invalidateQueries()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const rows = useMemo(() => (members ?? []).filter((m) => filter === 'all' || m.accountStatus === filter), [members, filter])
  const count = (s: Filter) => (s === 'all' ? members?.length : members?.filter((m) => m.accountStatus === s).length) ?? 0

  const columns = useMemo<ColumnDef<Member>[]>(() => [
    { accessorKey: 'fullName', header: 'Member', cell: ({ row: { original: m } }) => (
      <button onClick={() => setViewing(m)} className="flex cursor-pointer items-center gap-3 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{initials(m.fullName)}</span>
        <span className="min-w-0"><span className="block font-medium hover:text-accent">{m.fullName}</span><span className="block font-mono text-xs text-muted">{m.memberId}</span></span>
      </button>) },
    { accessorKey: 'email', header: 'Contact', cell: ({ row: { original: m } }) => (
      <div className="text-xs"><p>{m.email}</p><p className="text-muted">{m.contactNo}</p></div>) },
    { id: 'location', header: 'Location', accessorFn: (m) => `${m.city} ${m.state}`, cell: ({ row: { original: m } }) => <span className="text-muted">{[m.city, m.state].filter(Boolean).join(', ')}</span> },
    { id: 'loans', header: 'Loans', accessorFn: (m) => loans.get(m.memberId) ?? 0, cell: ({ getValue }) => <span className={cn(getValue<number>() ? 'font-semibold' : 'text-muted')}>{getValue<number>()}</span> },
    { accessorKey: 'accountStatus', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<AccountStatus>()} /> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row: { original: m } }) => (
      <div className="flex justify-end gap-1">
        {m.accountStatus !== 'active' && (
          <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: m.memberId, status: 'active' })}><CheckCircle2 className="h-3.5 w-3.5 text-success" />Activate</Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => setViewing(m)} aria-label={`View ${m.fullName}`}><Eye className="h-4 w-4" /></Button>
      </div>) },
  ], [loans, setStatus])

  return (
    <>
      <PageHeader title="Members" description="Approve sign-ups and manage accounts." />
      <DataTable
        data={rows} columns={columns} loading={isLoading} searchPlaceholder="Search members…" emptyTitle="No members"
        toolbar={
          <div className="scrollbar-thin flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 text-sm">
            {([['all', 'All'], ['pending', 'Pending'], ['active', 'Active'], ['deactive', 'Deactivated']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn('flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors', filter === k ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}>
                {label}<span className="text-xs text-muted">{count(k)}</span>
              </button>
            ))}
          </div>
        }
      />

      <MemberDrawer member={viewing} onClose={() => setViewing(null)}
        onStatus={(status) => viewing && setStatus.mutate({ id: viewing.memberId, status })} busy={setStatus.isPending}
        onDelete={() => setDeleting(viewing)} />

      <ConfirmDialog open={Boolean(deleting)} title="Remove this member?" danger confirmLabel="Remove member" loading={remove.isPending}
        message={deleting && <>This permanently deletes <b className="text-ink">{deleting.fullName}</b>'s account. Members with borrowed books can't be removed until they're returned.</>}
        onConfirm={() => deleting && remove.mutate(deleting)} onClose={() => setDeleting(null)} />
    </>
  )
}

function MemberDrawer({ member, onClose, onStatus, onDelete, busy }: {
  member: Member | null; onClose: () => void; onStatus: (s: AccountStatus) => void; onDelete: () => void; busy: boolean
}) {
  const { data: loans, isLoading } = useQuery({
    queryKey: ['issues', 'member', member?.memberId],
    queryFn: async () => (await api.get<import('@/lib/types').Issue[]>('/api/admin/issues')).filter((i) => i.memberId === member!.memberId),
    enabled: Boolean(member),
  })
  if (!member) return <Modal open={false} onClose={onClose} title="">{null}</Modal>

  const actions: { status: AccountStatus; label: string; icon: typeof Ban; cls: string }[] = [
    { status: 'active', label: 'Active', icon: CheckCircle2, cls: 'text-success' },
    { status: 'pending', label: 'Pending', icon: Clock, cls: 'text-warning' },
    { status: 'deactive', label: 'Deactivate', icon: Ban, cls: 'text-danger' },
  ]

  return (
    <Modal open onClose={onClose} title={member.fullName} description={`Member ID ${member.memberId}`} size="lg"
      footer={<>
        <Button variant="ghost" className="mr-auto text-danger" onClick={onDelete}><Trash2 className="h-4 w-4" />Remove</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </>}>
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Account status</p>
          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ status, label, icon: Icon, cls }) => (
              <button key={status} disabled={busy || member.accountStatus === status} onClick={() => onStatus(status)}
                className={cn('flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-default',
                  member.accountStatus === status ? 'border-accent bg-accent-soft text-ink' : 'border-border hover:bg-surface-2')}>
                <Icon className={cn('h-4 w-4', cls)} />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Info icon={Mail} label="Email" value={member.email} />
          <Info icon={Phone} label="Phone" value={member.contactNo} />
          <Info icon={Clock} label="Date of birth" value={formatDate(member.dob)} />
          <Info icon={MapPin} label="Address" value={[member.fullAddress, member.city, member.state, member.pincode].filter(Boolean).join(', ')} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Borrowed books</p>
          {isLoading ? <Skeleton className="h-16" /> : !loans?.length ? <p className="text-sm text-muted">No books borrowed.</p> : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {loans.map((i) => (
                <li key={i.bookId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="truncate">{i.bookName}</span>
                  <Badge tone={i.overdue ? 'danger' : 'neutral'}>{dueLabel(i.daysLeft)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-surface-2 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="break-words text-sm">{value || '—'}</p></div>
    </div>
  )
}
