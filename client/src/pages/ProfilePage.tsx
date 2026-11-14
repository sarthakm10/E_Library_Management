import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, Bookmark, BookOpenCheck, Clock, History, IndianRupee, KeyRound, Library, RefreshCw, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { MemberFields } from '@/components/member-fields'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Badge, Card, EmptyState, Skeleton, StatusBadge } from '@/components/ui/misc'
import { api, errorMessage } from '@/lib/api'
import { keys, useMyHistory, useMyHolds, useMyIssues, useProfile } from '@/lib/queries'
import { memberDetailsSchema, type MemberDetails } from '@/lib/schemas'
import { cn, currency, dueLabel, formatDate, initials } from '@/lib/utils'
import { BookCover } from '@/components/book-cover'
import type { HistoryEntry, Hold, Issue, Member } from '@/lib/types'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(6, 'At least 6 characters').max(50),
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { message: "Passwords don't match", path: ['confirm'] })
type PasswordValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: issues, isLoading: loadingIssues } = useMyIssues()
  const { data: holds } = useMyHolds()
  const { data: history } = useMyHistory()
  const overdue = issues?.filter((i) => i.overdue).length ?? 0
  const unpaid = history?.filter((h) => h.fine > 0 && !h.finePaid).reduce((sum, h) => sum + h.fine, 0) ?? 0
  const accruing = issues?.reduce((sum, i) => sum + i.fine, 0) ?? 0
  const readyHolds = holds?.filter((h) => h.status === 'ready') ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-br from-accent via-cyan to-lime text-2xl font-semibold text-accent-ink shadow-glow">{initials(user?.name ?? '')}</div>
        <div className="flex-1">
          <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">Hi, <span className="text-gradient font-serif font-normal italic">{user?.name.split(' ')[0]}</span></h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-mono">{user?.id}</span>
            {profile && <StatusBadge status={profile.accountStatus} />}
          </div>
        </div>
        <Link to="/books"><Button variant="outline"><Library className="h-4 w-4" />Browse books</Button></Link>
      </div>

      {profile?.accountStatus === 'pending' && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p><span className="font-semibold">Your membership is awaiting approval.</span> You can browse the catalog now; you'll be able to borrow once an admin activates your account.</p>
        </div>
      )}

      {readyHolds.map((h) => (
        <div key={h.bookId} className="mt-6 flex gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm text-success">
          <Bookmark className="mt-0.5 h-4 w-4 shrink-0" />
          <p><span className="font-semibold">{h.bookName} is ready for you.</span> Collect it from the desk by {formatDate(h.readyUntil)}, or it goes to the next person in line.</p>
        </div>
      ))}

      {(unpaid > 0 || accruing > 0) && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          <IndianRupee className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {unpaid > 0 && <><span className="font-semibold">You owe {currency.format(unpaid)} in late fines.</span> Pay at the desk. </>}
            {accruing > 0 && <>Your overdue books have added {currency.format(accruing)} so far, and more each day until they're returned.</>}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Loans */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-semibold">Borrowed books</h2>
            {overdue > 0 && <Badge tone="danger"><AlertTriangle className="h-3 w-3" />{overdue} overdue</Badge>}
          </div>
          {loadingIssues ? (
            <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : !issues?.length ? (
            <Card><EmptyState icon={BookOpenCheck} title="No books borrowed">When you borrow from the desk, they'll show up here with their due dates.</EmptyState></Card>
          ) : (
            <div className="space-y-3">{issues.map((i, n) => <LoanCard key={i.bookId} issue={i} index={n} />)}</div>
          )}

          {!!holds?.length && (
            <>
              <h2 className="mb-4 mt-10 font-sans text-lg font-semibold">Holds</h2>
              <div className="space-y-3">{holds.map((h) => <HoldCard key={h.bookId} hold={h} />)}</div>
            </>
          )}

          <h2 className="mb-4 mt-10 flex items-center gap-2 font-sans text-lg font-semibold"><History className="h-4 w-4 text-muted" />Reading history</h2>
          {!history?.length ? (
            <Card><EmptyState icon={History} title="Nothing returned yet">Books you've returned will be listed here.</EmptyState></Card>
          ) : (
            <Card className="divide-y divide-border">{history.map((h) => <HistoryRow key={h.id} entry={h} />)}</Card>
          )}
        </section>

        {/* Details */}
        <section className="space-y-6">
          {isLoading || !profile ? <Skeleton className="h-96 rounded-2xl" /> : <DetailsForm profile={profile} onSaved={refresh} />}
          <PasswordForm />
        </section>
      </div>
    </div>
  )
}

function LoanCard({ issue, index }: { issue: Issue; index: number }) {
  const total = 14
  const left = issue.daysLeft ?? total
  const pct = Math.max(4, Math.min(100, ((total - left) / total) * 100))
  const tone = issue.overdue ? 'danger' : left <= 3 ? 'warning' : 'success'
  const qc = useQueryClient()
  const renew = useMutation({
    mutationFn: () => api.post<Issue>(`/api/me/issues/${issue.bookId}/renew`),
    onSuccess: async (r) => { await qc.invalidateQueries({ queryKey: keys.myIssues }); toast.success(`Renewed. Now due ${formatDate(r.dueDate)}`) },
    onError: (err) => toast.error(errorMessage(err)),
  })
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className={cn('p-4', issue.overdue && 'border-danger/40')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/books/${issue.bookId}`} className="font-medium hover:text-accent">{issue.bookName}</Link>
            <p className="mt-0.5 text-xs text-muted">Borrowed {formatDate(issue.issueDate)} · Due {formatDate(issue.dueDate)}</p>
          </div>
          <Badge tone={tone}>{dueLabel(issue.daysLeft)}</Badge>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div className={cn('h-full rounded-full', { danger: 'bg-danger', warning: 'bg-warning', success: 'bg-gradient-to-r from-accent to-cyan' }[tone])}
            initial={{ width: 0 }} animate={{ width: `${issue.overdue ? 100 : pct}%` }} transition={{ duration: 0.8, delay: 0.1 + index * 0.05 }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted">
            {issue.overdue && <span className="font-medium text-danger">Fine so far {currency.format(issue.fine)} · </span>}
            {issue.renewCount > 0 ? `Renewed ${issue.renewCount}×` : 'Not renewed'}
            {issue.renewBlock && <> · {issue.renewBlock}</>}
          </span>
          {!issue.renewBlock && (
            <Button variant="outline" size="sm" loading={renew.isPending} onClick={() => renew.mutate()}><RefreshCw className="h-3.5 w-3.5" />Renew</Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function HoldCard({ hold }: { hold: Hold }) {
  const qc = useQueryClient()
  const cancel = useMutation({
    mutationFn: () => api.del(`/api/me/holds/${hold.bookId}`),
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: keys.myHolds }), qc.invalidateQueries({ queryKey: keys.books })])
      toast.success('Hold cancelled')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
  return (
    <Card className="flex items-center gap-3 p-3">
      <BookCover src={hold.imageUrl} title={hold.bookName} className="h-14 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <Link to={`/books/${hold.bookId}`} className="block truncate font-medium hover:text-accent">{hold.bookName}</Link>
        <p className="text-xs text-muted">
          {hold.status === 'ready' ? `Ready at the desk · collect by ${formatDate(hold.readyUntil)}` : `Waiting · number ${hold.position} in line`}
        </p>
      </div>
      {hold.status === 'ready' ? <Badge tone="success">Ready</Badge> : <Badge>#{hold.position}</Badge>}
      <Button variant="ghost" size="sm" aria-label={`Cancel hold on ${hold.bookName}`} loading={cancel.isPending} onClick={() => cancel.mutate()}><X className="h-4 w-4" /></Button>
    </Card>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <Link to={`/books/${entry.bookId}`} className="font-medium hover:text-accent">{entry.bookName}</Link>
        <p className="text-xs text-muted">
          {formatDate(entry.issueDate)} – {formatDate(entry.returnDate)}
          {entry.renewCount > 0 && ` · renewed ${entry.renewCount}×`}
          {entry.daysLate > 0 && ` · ${entry.daysLate} day${entry.daysLate === 1 ? '' : 's'} late`}
        </p>
      </div>
      {entry.fine > 0
        ? <Badge tone={entry.finePaid ? 'neutral' : 'danger'}>{currency.format(entry.fine)} {entry.finePaid ? 'paid' : 'unpaid'}</Badge>
        : <Badge tone="success">On time</Badge>}
    </div>
  )
}

function DetailsForm({ profile, onSaved }: { profile: Member; onSaved: () => Promise<void> }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<MemberDetails>({
    resolver: zodResolver(memberDetailsSchema),
    defaultValues: profile,
  })
  useEffect(() => reset(profile), [profile, reset])

  const save = useMutation({
    mutationFn: (values: MemberDetails) => api.put<Member>('/api/me/profile', values),
    onSuccess: async (updated) => {
      qc.setQueryData(keys.profile, updated)
      await onSaved()
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Card className="p-6">
      <h2 className="mb-5 font-sans text-lg font-semibold">Your details</h2>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
        <MemberFields register={register} errors={errors} />
        <div className="mt-5 flex justify-end">
          <Button type="submit" loading={save.isPending} disabled={!isDirty}><Save className="h-4 w-4" />Save changes</Button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })
  const change = useMutation({
    mutationFn: ({ currentPassword, newPassword }: PasswordValues) => api.put('/api/me/password', { currentPassword, newPassword }),
    onSuccess: () => { toast.success('Password changed'); reset(); setOpen(false) },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold"><KeyRound className="h-4 w-4 text-muted" />Password</h2>
        {!open && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Change</Button>}
      </div>
      {open && (
        <form onSubmit={handleSubmit((v) => change.mutate(v))} className="mt-5 grid gap-4" noValidate>
          <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input id="currentPassword" type="password" autoComplete="current-password" {...register('currentPassword')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
              <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
            </Field>
            <Field label="Confirm" htmlFor="confirmPw" error={errors.confirm?.message}>
              <Input id="confirmPw" type="password" autoComplete="new-password" {...register('confirm')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { reset(); setOpen(false) }}>Cancel</Button>
            <Button type="submit" loading={change.isPending}>Update password</Button>
          </div>
        </form>
      )}
    </Card>
  )
}
