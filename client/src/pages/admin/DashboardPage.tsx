import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BookCopy, BookOpen, CheckCircle2, Clock, Users, type LucideIcon } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/misc'
import { AnimatedNumber } from '@/components/fx/animated-number'
import { SpotlightCard } from '@/components/fx/spotlight'
import { api, errorMessage } from '@/lib/api'
import { useDashboard } from '@/lib/queries'
import { cn, dueLabel, formatDate } from '@/lib/utils'
import type { Issue } from '@/lib/types'

const STATUS_COLORS = { active: 'var(--color-success)', pending: 'var(--color-warning)', deactive: 'var(--color-danger)' }

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()
  const qc = useQueryClient()

  const activate = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/members/${encodeURIComponent(id)}/status`, { status: 'active' }),
    onSuccess: () => { toast.success('Member activated'); qc.invalidateQueries() },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title={greeting} description="Here's what's happening at the library today." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 rounded-2xl lg:col-span-2" /><Skeleton className="h-80 rounded-2xl" /></div>
      </>
    )
  }

  const statusData = (Object.entries(data.membersByStatus) as [keyof typeof STATUS_COLORS, number][])
    .map(([name, value]) => ({ name, value })).filter((d) => d.value > 0)
  const usage = data.totalCopies ? Math.round((data.issuedCopies / data.totalCopies) * 100) : 0

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-muted">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tighter sm:text-5xl">{greeting.split(' ')[0]} <span className="text-gradient font-serif font-normal italic">{greeting.split(' ')[1]}</span></h1>
        </div>
        <Link to="/admin/issues"><Button variant="accent">Issue a book<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat icon={BookOpen} label="Titles" value={data.titles} sub={`${data.totalCopies} copies in total`} i={0} />
        <Stat icon={BookCopy} label="On loan" value={data.issuedCopies} sub={`${usage}% of the collection`} i={1} progress={usage} />
        <Stat icon={Users} label="Members" value={data.members} sub={`${data.membersByStatus.pending ?? 0} awaiting approval`} i={2} />
        <Stat icon={AlertTriangle} label="Overdue" value={data.overdueCount} sub={data.overdueCount ? 'Need follow-up' : 'All caught up'} i={3} danger={data.overdueCount > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 p-5 lg:col-span-2">
          <h2 className="font-sans text-base font-semibold">Books by genre</h2>
          <p className="text-xs text-muted">Number of titles tagged with each genre</p>
          <div className="mt-4 h-64">
            {data.genres.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.genres} margin={{ left: 0, right: 8, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={64} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} contentStyle={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                  <defs>
                    <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--color-accent)" />
                      <stop offset="1" stopColor="var(--color-cyan)" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" name="Titles" fill="url(#bar-fill)" radius={[8, 8, 2, 2]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={BookOpen} title="No books yet" />}
          </div>
        </Card>

        <Card className="min-w-0 p-5">
          <h2 className="font-sans text-base font-semibold">Membership</h2>
          <p className="text-xs text-muted">Accounts by status</p>
          <div className="relative mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none">
                  {statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="font-display text-2xl font-semibold">{data.members}</p><p className="text-xs text-muted">members</p></div>
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            {(['active', 'pending', 'deactive'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 capitalize text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />{s === 'deactive' ? 'Deactivated' : s} {data.membersByStatus[s] ?? 0}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-sans text-base font-semibold">Needs attention</h2>
              <p className="text-xs text-muted">Overdue and due within 3 days</p>
            </div>
            <Link to="/admin/issues" className="text-sm font-medium text-accent hover:underline">All loans</Link>
          </div>
          {data.overdue.length + data.dueSoon.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing due">No loans are overdue or due in the next few days.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {[...data.overdue, ...data.dueSoon].map((i) => <LoanRow key={`${i.memberId}-${i.bookId}`} issue={i} />)}
            </ul>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-sans text-base font-semibold">Awaiting approval</h2>
            <p className="text-xs text-muted">New members who signed up</p>
          </div>
          {data.pendingMembers.length === 0 ? (
            <EmptyState icon={Clock} title="No pending sign-ups" />
          ) : (
            <ul className="divide-y divide-border">
              {data.pendingMembers.map((m) => (
                <li key={m.memberId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.fullName}</p>
                    <p className="truncate text-xs text-muted">{m.memberId} · {m.city}</p>
                  </div>
                  <Button size="sm" variant="outline" loading={activate.isPending && activate.variables === m.memberId} onClick={() => activate.mutate(m.memberId)}>Activate</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function Stat({ icon: Icon, label, value, sub, i, danger, progress }: {
  icon: LucideIcon; label: string; value: number; sub: string; i: number; danger?: boolean; progress?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <SpotlightCard className={cn('h-full p-4 sm:p-5', danger && 'border-danger/30')}>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <span className={cn('grid h-8 w-8 place-items-center rounded-xl border', danger ? 'border-danger/25 bg-danger-soft text-danger' : 'border-border bg-surface-2 text-accent')}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <AnimatedNumber value={value} className={cn('mt-4 block text-4xl font-semibold tracking-tighter sm:text-5xl', danger && value > 0 && 'text-danger')} />
        <p className="mt-1 text-xs text-muted">{sub}</p>
        {progress !== undefined && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-cyan" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.3 }} />
          </div>
        )}
      </SpotlightCard>
    </motion.div>
  )
}

function LoanRow({ issue }: { issue: Issue }) {
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{issue.bookName}</p>
        <p className="truncate text-xs text-muted">{issue.memberName} ({issue.memberId}) · due {formatDate(issue.dueDate)}</p>
      </div>
      <Badge tone={issue.overdue ? 'danger' : 'warning'}>{dueLabel(issue.daysLeft)}</Badge>
    </li>
  )
}
