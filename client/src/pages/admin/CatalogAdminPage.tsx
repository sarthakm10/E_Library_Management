import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Field, Input } from '@/components/ui/field'
import { Badge, PageHeader } from '@/components/ui/misc'
import { ConfirmDialog, Modal } from '@/components/ui/modal'
import { api, errorMessage } from '@/lib/api'
import { useAuthors, usePublishers } from '@/lib/queries'
import type { CatalogEntry } from '@/lib/types'

const schema = z.object({
  id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,30}$/, 'Letters, numbers, _ or - only'),
  name: z.string().trim().min(1, 'Name is required').max(200),
})
type Values = z.infer<typeof schema>

const copy = {
  authors: { title: 'Authors', one: 'author', desc: 'Writers that books in the catalog are credited to.' },
  publishers: { title: 'Publishers', one: 'publisher', desc: 'Publishing houses for books in the catalog.' },
}

export default function CatalogAdminPage({ kind }: { kind: 'authors' | 'publishers' }) {
  const authors = useAuthors()
  const publishers = usePublishers()
  const { data, isLoading } = kind === 'authors' ? authors : publishers
  const qc = useQueryClient()
  const text = copy[kind]
  const [editing, setEditing] = useState<CatalogEntry | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogEntry | null>(null)

  const remove = useMutation({
    mutationFn: (e: CatalogEntry) => api.del(`/api/admin/${kind}/${encodeURIComponent(e.id)}`),
    onSuccess: (_, e) => { toast.success(`Deleted ${e.name}`); setDeleting(null); qc.invalidateQueries() },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const columns = useMemo<ColumnDef<CatalogEntry>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs text-muted">{getValue<string>()}</span> },
    { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { accessorKey: 'bookCount', header: 'Books', cell: ({ getValue }) => <Badge tone={getValue<number>() ? 'accent' : 'neutral'}>{getValue<number>()} {getValue<number>() === 1 ? 'book' : 'books'}</Badge> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => setEditing(row.original)} aria-label={`Rename ${row.original.name}`}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="text-danger" onClick={() => setDeleting(row.original)} aria-label={`Delete ${row.original.name}`}><Trash2 className="h-4 w-4" /></Button>
      </div>) },
  ], [])

  return (
    <>
      <PageHeader title={text.title} description={text.desc}
        actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add {text.one}</Button>} />
      <DataTable data={data} columns={columns} loading={isLoading} searchPlaceholder={`Search ${kind}…`} emptyTitle={`No ${kind} yet`} />

      <EntryForm kind={kind} entry={editing === 'new' ? null : editing} open={editing !== null} onClose={() => setEditing(null)} />

      <ConfirmDialog open={Boolean(deleting)} title={`Delete ${text.one}?`} danger confirmLabel="Delete" loading={remove.isPending}
        message={deleting && (deleting.bookCount > 0
          ? <><b className="text-ink">{deleting.name}</b> is used by {deleting.bookCount} book(s). Reassign those books first, or the delete will be refused.</>
          : <>This removes <b className="text-ink">{deleting.name}</b> permanently.</>)}
        onConfirm={() => deleting && remove.mutate(deleting)} onClose={() => setDeleting(null)} />
    </>
  )
}

function EntryForm({ kind, entry, open, onClose }: { kind: 'authors' | 'publishers'; entry: CatalogEntry | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const one = copy[kind].one
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })
  useEffect(() => { if (open) reset(entry ?? { id: '', name: '' }) }, [open, entry, reset])

  const save = useMutation({
    mutationFn: (v: Values) => entry ? api.put(`/api/admin/${kind}/${encodeURIComponent(entry.id)}`, v) : api.post(`/api/admin/${kind}`, v),
    onSuccess: () => {
      toast.success(entry ? `Renamed ${one}${entry.bookCount ? ` and updated ${entry.bookCount} book(s)` : ''}` : `Added ${one}`)
      qc.invalidateQueries()
      onClose()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Modal open={open} onClose={onClose} size="sm" title={entry ? `Rename ${one}` : `Add ${one}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="entry-form" loading={save.isPending}>Save</Button></>}>
      <form id="entry-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <Field label="ID" htmlFor="entry-id" error={errors.id?.message} hint={entry ? "IDs can't be changed" : 'Short code, e.g. A7'}>
          <Input id="entry-id" disabled={Boolean(entry)} {...register('id')} />
        </Field>
        <Field label="Name" htmlFor="entry-name" error={errors.name?.message} hint={entry?.bookCount ? `Renaming also updates ${entry.bookCount} book(s)` : undefined}>
          <Input id="entry-name" {...register('name')} />
        </Field>
      </form>
    </Modal>
  )
}
