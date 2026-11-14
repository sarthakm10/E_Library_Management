import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { ImagePlus, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { BookCover } from '@/components/book-cover'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Badge, PageHeader } from '@/components/ui/misc'
import { ConfirmDialog, Modal } from '@/components/ui/modal'
import { api, ApiError, errorMessage } from '@/lib/api'
import { GENRES, LANGUAGES } from '@/lib/constants'
import { useAuthors, useBooks, usePublishers } from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/types'

const num = (label: string) => z.coerce.number({ invalid_type_error: `${label} must be a number` }).int().min(0, `${label} can't be negative`)

const schema = z.object({
  bookId: z.string().trim().regex(/^[A-Za-z0-9_-]{1,30}$/, 'Letters, numbers, _ or - only'),
  bookName: z.string().trim().min(1, 'Title is required').max(300),
  genres: z.array(z.string()).min(1, 'Pick at least one genre'),
  authorName: z.string().min(1, 'Pick an author'),
  publisherName: z.string().min(1, 'Pick a publisher'),
  publishDate: z.string().optional(),
  language: z.string().min(1, 'Pick a language'),
  edition: z.string().optional(),
  bookCost: num('Cost'),
  pages: num('Pages'),
  description: z.string().max(2000).optional(),
  actualStock: num('Stock').max(10000),
  imageLink: z.string().optional(),
})
type Values = z.infer<typeof schema>

export default function BooksAdminPage() {
  const { data: books, isLoading } = useBooks()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Book | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Book | null>(null)

  const remove = useMutation({
    mutationFn: (b: Book) => api.del(`/api/admin/books/${encodeURIComponent(b.bookId)}`),
    onSuccess: (_, b) => {
      toast.success(`Deleted “${b.bookName}”`)
      setDeleting(null)
      qc.invalidateQueries()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const columns = useMemo<ColumnDef<Book>[]>(() => [
    { accessorKey: 'bookName', header: 'Book', cell: ({ row: { original: b } }) => (
      <div className="flex items-center gap-3">
        <BookCover src={b.imageUrl} title={b.bookName} className="h-14 w-10 shrink-0 rounded-md p-1 text-[8px] [&_p]:text-[8px] [&_svg]:hidden" />
        <div className="min-w-0">
          <Link to={`/books/${b.bookId}`} className="line-clamp-1 font-medium hover:text-accent">{b.bookName}</Link>
          <p className="font-mono text-xs text-muted">{b.bookId}</p>
        </div>
      </div>) },
    { accessorKey: 'authorName', header: 'Author' },
    { id: 'genres', header: 'Genres', accessorFn: (b) => b.genres.join(', '), enableSorting: false, cell: ({ row }) => (
      <div className="flex max-w-56 flex-wrap gap-1">{row.original.genres.slice(0, 3).map((g) => <Badge key={g}>{g}</Badge>)}{row.original.genres.length > 3 && <Badge>+{row.original.genres.length - 3}</Badge>}</div>) },
    { accessorKey: 'language', header: 'Language' },
    { accessorKey: 'currentStock', header: 'Stock', cell: ({ row: { original: b } }) => (
      <div className="min-w-24">
        <p className="text-sm"><span className="font-semibold">{b.currentStock}</span><span className="text-muted"> / {b.actualStock} on shelf</span></p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
          <div className={cn('h-full rounded-full', b.currentStock === 0 ? 'bg-danger' : 'bg-success')} style={{ width: `${b.actualStock ? (b.currentStock / b.actualStock) * 100 : 0}%` }} />
        </div>
      </div>) },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => setEditing(row.original)} aria-label={`Edit ${row.original.bookName}`}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="text-danger" onClick={() => setDeleting(row.original)} aria-label={`Delete ${row.original.bookName}`}><Trash2 className="h-4 w-4" /></Button>
      </div>) },
  ], [])

  return (
    <>
      <PageHeader title="Book inventory" description={books ? `${books.length} titles · ${books.reduce((n, b) => n + b.actualStock, 0)} copies` : undefined}
        actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add book</Button>} />
      <DataTable data={books} columns={columns} loading={isLoading} searchPlaceholder="Search by title, author, genre…" emptyTitle="No books yet" emptyText="Add your first book to get started." />

      <BookForm open={editing !== null} book={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />

      <ConfirmDialog open={Boolean(deleting)} title="Delete this book?" danger confirmLabel="Delete" loading={remove.isPending}
        message={deleting && <>This permanently removes <b className="text-ink">{deleting.bookName}</b> from the catalog. Books that are currently issued can't be deleted.</>}
        onConfirm={() => deleting && remove.mutate(deleting)} onClose={() => setDeleting(null)} />
    </>
  )
}

function BookForm({ open, book, onClose }: { open: boolean; book: Book | null; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: authors } = useAuthors()
  const { data: publishers } = usePublishers()
  const [preview, setPreview] = useState<string | undefined>()
  const isEdit = Boolean(book)

  const { register, handleSubmit, reset, control, setValue, setError, watch, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset(book ? { ...book, imageLink: '' } : {
      bookId: '', bookName: '', genres: [], authorName: '', publisherName: '', publishDate: '', language: 'English',
      edition: '', bookCost: 0, pages: 0, description: '', actualStock: 1, imageLink: '',
    })
    setPreview(book?.imageUrl)
  }, [open, book, reset])

  const save = useMutation({
    mutationFn: (v: Values) => isEdit
      ? api.put<Book>(`/api/admin/books/${encodeURIComponent(book!.bookId)}`, v)
      : api.post<Book>('/api/admin/books', v),
    onSuccess: (b) => {
      toast.success(isEdit ? `Saved “${b.bookName}”` : `Added “${b.bookName}”`)
      qc.invalidateQueries()
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) Object.entries(err.fields).forEach(([k, m]) => setError(k as keyof Values, { message: m }))
      toast.error(errorMessage(err))
    },
  })

  const issued = book ? book.actualStock - book.currentStock : 0
  const stock = watch('actualStock')

  return (
    <Modal open={open} onClose={onClose} size="xl" title={isEdit ? 'Edit book' : 'Add a book'} description={isEdit ? book!.bookName : 'Fill in the details below.'}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="book-form" loading={save.isPending}>{isEdit ? 'Save changes' : 'Add book'}</Button>
      </>}>
      <form id="book-form" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="grid gap-6 md:grid-cols-[200px_1fr]">
        <CoverDrop preview={preview} title={watch('bookName') || 'New book'} onUploaded={(link, url) => { setValue('imageLink', link, { shouldDirty: true }); setPreview(url) }} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Book ID" htmlFor="bookId" error={errors.bookId?.message} hint={isEdit ? "IDs can't be changed" : undefined}>
            <Input id="bookId" disabled={isEdit} aria-invalid={!!errors.bookId} {...register('bookId')} />
          </Field>
          <Field label="Language" htmlFor="language" error={errors.language?.message}>
            <Select id="language" {...register('language')}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              {book && !LANGUAGES.includes(book.language as never) && book.language && <option>{book.language}</option>}
            </Select>
          </Field>
          <Field label="Title" htmlFor="bookName" error={errors.bookName?.message} className="sm:col-span-2">
            <Input id="bookName" aria-invalid={!!errors.bookName} {...register('bookName')} />
          </Field>
          <Field label="Author" htmlFor="authorName" error={errors.authorName?.message} hint={authors?.length === 0 ? 'Add authors first' : undefined}>
            <Select id="authorName" aria-invalid={!!errors.authorName} {...register('authorName')}>
              <option value="">Select author</option>
              {authors?.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Publisher" htmlFor="publisherName" error={errors.publisherName?.message} hint={publishers?.length === 0 ? 'Add publishers first' : undefined}>
            <Select id="publisherName" aria-invalid={!!errors.publisherName} {...register('publisherName')}>
              <option value="">Select publisher</option>
              {publishers?.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </Select>
          </Field>

          <Field label="Genres" error={errors.genres?.message} className="sm:col-span-2">
            <Controller control={control} name="genres" render={({ field }) => (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-border p-2.5">
                {[...new Set([...GENRES, ...(field.value ?? [])])].map((g) => {
                  const on = field.value?.includes(g)
                  return (
                    <button type="button" key={g} onClick={() => field.onChange(on ? field.value.filter((x) => x !== g) : [...(field.value ?? []), g])}
                      className={cn('cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        on ? 'border-accent bg-accent text-accent-ink' : 'border-border text-muted hover:text-ink')}>
                      {g}
                    </button>
                  )
                })}
              </div>
            )} />
          </Field>

          <Field label="Publish date" htmlFor="publishDate"><Input id="publishDate" type="date" {...register('publishDate')} /></Field>
          <Field label="Edition" htmlFor="edition"><Input id="edition" {...register('edition')} /></Field>
          <Field label="Cost (₹)" htmlFor="bookCost" error={errors.bookCost?.message}><Input id="bookCost" type="number" min={0} {...register('bookCost')} /></Field>
          <Field label="Pages" htmlFor="pages" error={errors.pages?.message}><Input id="pages" type="number" min={0} {...register('pages')} /></Field>
          <Field label="Total copies" htmlFor="actualStock" error={errors.actualStock?.message}
            hint={isEdit ? `${issued} issued · ${Math.max(0, Number(stock || 0) - issued)} will be on the shelf` : 'All copies start on the shelf'}>
            <Input id="actualStock" type="number" min={isEdit ? issued : 0} {...register('actualStock')} />
          </Field>
          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" rows={3} {...register('description')} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

function CoverDrop({ preview, title, onUploaded }: { preview?: string; title: string; onUploaded: (link: string, url: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const upload = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post<{ link: string; url: string }>('/api/admin/uploads', fd)
    },
    onSuccess: ({ link, url }) => { onUploaded(link, url); toast.success('Cover uploaded') },
    onError: (err) => toast.error(errorMessage(err)),
  })
  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) return toast.error('Image must be under 5 MB')
    upload.mutate(f)
  }

  return (
    <div>
      <button type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }}
        className={cn('group relative block aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          drag ? 'border-accent bg-accent-soft' : 'border-border hover:border-accent/60')}>
        {preview ? <BookCover src={preview} title={title} className="h-full w-full" /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted">
            <ImagePlus className="h-8 w-8" /><p className="text-sm font-medium">Drop a cover here</p><p className="text-xs">or click to browse</p>
          </div>
        )}
        <div className={cn('absolute inset-0 grid place-items-center bg-black/50 text-white transition-opacity', upload.isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
          {upload.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4" />Change cover</span>}
        </div>
      </button>
      <p className="mt-2 text-center text-xs text-muted">JPG, PNG or WEBP · up to 5 MB</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
    </div>
  )
}
