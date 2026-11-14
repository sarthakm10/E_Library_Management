import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, BookX, Calendar, Globe, Hash, Layers, Search, SlidersHorizontal, X } from 'lucide-react'
import { BookCover } from '@/components/book-cover'
import { Tilt } from '@/components/fx/tilt'
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui/misc'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { api, errorMessage } from '@/lib/api'
import { keys, myHoldsQuery, useBooks } from '@/lib/queries'
import { availableCopies, cn, currency, formatDate } from '@/lib/utils'
import type { Book, Hold } from '@/lib/types'

type SortKey = 'title' | 'newest' | 'available'

const PAGE_SIZE = 30

export function CatalogPage() {
  const { data: books, isLoading, error } = useBooks()
  const [params, setParams] = useSearchParams()
  const { bookId } = useParams()
  const navigate = useNavigate()

  const q = params.get('q') ?? ''
  const genre = params.get('genre') ?? ''
  const language = params.get('lang') ?? ''
  const onlyAvailable = params.get('available') === '1'
  const sort = (params.get('sort') as SortKey) ?? 'title'

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const genres = useMemo(() => [...new Set((books ?? []).flatMap((b) => b.genres))].sort(), [books])
  const languages = useMemo(() => [...new Set((books ?? []).map((b) => b.language).filter(Boolean))].sort(), [books])

  // Filtering 300 books is cheap; re-rendering the grid on every keystroke isn't. Let typing stay snappy.
  const deferredQ = useDeferredValue(q)

  const results = useMemo(() => {
    const term = deferredQ.trim().toLowerCase()
    const list = (books ?? []).filter((b) =>
      (!term || [b.bookName, b.authorName, b.publisherName, b.bookId, ...b.genres].some((v) => v.toLowerCase().includes(term))) &&
      (!genre || b.genres.includes(genre)) &&
      (!language || b.language === language) &&
      (!onlyAvailable || availableCopies(b) > 0))
    const sorted = [...list]
    if (sort === 'title') sorted.sort((a, b) => a.bookName.localeCompare(b.bookName))
    if (sort === 'newest') sorted.sort((a, b) => b.publishDate.localeCompare(a.publishDate))
    if (sort === 'available') sorted.sort((a, b) => availableCopies(b) - availableCopies(a))
    return sorted
  }, [books, deferredQ, genre, language, onlyAvailable, sort])

  // Render the grid a page at a time; more cards mount as the sentinel nears the viewport.
  const filterKey = [deferredQ, genre, language, onlyAvailable, sort].join('|')
  const [limit, setLimit] = useState(PAGE_SIZE)
  useEffect(() => setLimit(PAGE_SIZE), [filterKey])
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit((l) => l + PAGE_SIZE)
    }, { rootMargin: '1200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [limit, results.length])
  // Card links keep the filters; the detail modal's own id isn't part of them.
  const search = params.toString()

  const selected = bookId ? books?.find((b) => b.bookId === bookId) : undefined
  const filtersActive = Boolean(q || genre || language || onlyAvailable)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-accent">The collection</p>
          <h1 className="mt-2 text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
            Find your <span className="text-gradient font-serif font-normal italic">next read</span>
          </h1>
        </div>
        <p className="text-sm text-muted sm:text-right">{books ? <><span className="font-semibold text-ink">{results.length}</span> of {books.length} titles · {genres.length} genres</> : 'Loading the shelves…'}</p>
      </div>

      {/* Search + filters */}
      <div className="glass sticky top-20 z-20 mb-10 rounded-[24px] p-2.5 shadow-soft sm:top-24">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => update('q', e.target.value)} placeholder="Search by title, author, publisher or genre"
              className="h-11 w-full rounded-full border border-transparent bg-surface-2/70 pl-11 pr-3 text-sm transition-all placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-4 focus:ring-accent/15" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={language} onChange={(e) => update('lang', e.target.value)} className="rounded-full sm:w-40" aria-label="Language">
              <option value="">All languages</option>
              {languages.map((l) => <option key={l}>{l}</option>)}
            </Select>
            <Select value={sort} onChange={(e) => update('sort', e.target.value === 'title' ? '' : e.target.value)} className="rounded-full sm:w-44" aria-label="Sort">
              <option value="title">Title A–Z</option>
              <option value="newest">Newest first</option>
              <option value="available">Most available</option>
            </Select>
            <button onClick={() => update('available', onlyAvailable ? '' : '1')} aria-pressed={onlyAvailable}
              className={cn('col-span-2 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all sm:col-span-1',
                onlyAvailable ? 'border-accent/50 bg-accent-soft text-accent shadow-glow' : 'border-border text-muted hover:text-ink')}>
              <SlidersHorizontal className="h-4 w-4" /> On the shelf
            </button>
          </div>
        </div>
        {genres.length > 0 && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
            <GenreChip label="All" active={!genre} onClick={() => update('genre', '')} />
            {genres.map((g) => <GenreChip key={g} label={g} active={genre === g} onClick={() => update('genre', genre === g ? '' : g)} />)}
          </div>
        )}
      </div>

      {error ? (
        <Card><EmptyState icon={BookX} title="Couldn't load books">{(error as Error).message}</EmptyState></Card>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3"><Skeleton className="aspect-[2/3] rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState icon={BookX} title="No books match">
            Try a different search or clear the filters.
            {filtersActive && <div className="mt-4"><Button variant="outline" onClick={() => setParams({}, { replace: true })}><X className="h-4 w-4" />Clear filters</Button></div>}
          </EmptyState>
        </Card>
      ) : (
        <>
          {/* Keyed on the filters so the grid fades in fresh after each change, without per-card layout animation. */}
          <div key={filterKey} className="grid grid-cols-2 gap-x-5 gap-y-8 [animation:fade-up_.35s_ease-out_both] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.slice(0, limit).map((b) => <BookCard key={b.bookId} book={b} search={search} />)}
          </div>
          {/* Loads automatically as it nears the viewport; also a plain button for keyboards and slow devices. */}
          {limit < results.length && (
            <div ref={sentinel} className="mt-12 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>Show more · {results.length - limit} left</Button>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(bookId)} onClose={() => navigate({ pathname: '/books', search: params.toString() })} title={selected?.bookName ?? 'Book'} size="lg">
        {selected ? <BookDetail book={selected} /> : isLoading ? <Skeleton className="h-64" /> : <p className="text-sm text-muted">We couldn't find that book.</p>}
      </Modal>
    </div>
  )
}

function GenreChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cn('relative shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
        active ? 'text-bg' : 'text-muted hover:text-ink')}>
      {active && <motion.span layoutId="genre-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
      <span className="relative">{label}</span>
    </button>
  )
}

function Availability({ book }: { book: Book }) {
  const free = availableCopies(book)
  const [dot, label] = free <= 0
    ? ['bg-danger', book.waiting ? `${book.waiting} waiting` : 'All out']
    : free <= 1 ? ['bg-warning', 'Last copy'] : ['bg-success', `${free} available`]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />{label}
    </span>
  )
}

// Memoised: filtering re-renders the grid, but unchanged cards are skipped.
// content-visibility lets the browser skip layout and paint for cards scrolled far off-screen.
const BookCard = memo(function BookCard({ book, search }: { book: Book; search: string }) {
  return (
    <div className="[contain-intrinsic-size:auto_380px] [content-visibility:auto]">
      <Link to={{ pathname: `/books/${book.bookId}`, search }} className="group block">
        <Tilt className="rounded-2xl">
          <div className="relative overflow-hidden rounded-2xl shadow-soft ring-1 ring-white/10 transition-shadow duration-300 group-hover:shadow-lift">
            <BookCover src={book.imageUrl} title={book.bookName} className="aspect-[2/3] w-full" />
            <div className="absolute left-2 top-2"><Availability book={book} /></div>
          </div>
        </Tilt>
        <h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent">{book.bookName}</h3>
        <p className="mt-0.5 truncate text-xs text-muted">{book.authorName}</p>
      </Link>
    </div>
  )
})

function BookDetail({ book }: { book: Book }) {
  const facts = [
    { icon: Globe, label: 'Language', value: book.language || '—' },
    { icon: Calendar, label: 'Published', value: formatDate(book.publishDate) },
    { icon: Layers, label: 'Pages', value: book.pages || '—' },
    { icon: Hash, label: 'Edition', value: book.edition || '—' },
  ]
  return (
    <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
      <BookCover src={book.imageUrl} title={book.bookName} className="mx-auto aspect-[2/3] w-44 rounded-2xl shadow-lift sm:w-full" />
      <div>
        <p className="text-sm text-muted">by <span className="font-medium text-ink">{book.authorName}</span> · {book.publisherName}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{book.genres.map((g) => <Badge key={g} tone="accent">{g}</Badge>)}</div>
        <p className="mt-4 text-sm leading-relaxed text-ink/85">{book.description || 'No description yet.'}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5">
              <Icon className="h-4 w-4 text-muted" />
              <div><p className="text-[11px] uppercase tracking-wide text-muted">{label}</p><p className="text-sm font-medium">{value}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">{availableCopies(book)} of {book.actualStock} copies on the shelf</p>
            <p className="text-xs text-muted">
              {book.reserved > 0 && <>{book.reserved} kept aside for holds · </>}
              {book.waiting > 0 && <>{book.waiting} waiting · </>}
              Ask at the desk with Book ID <span className="font-mono">{book.bookId}</span>
            </p>
          </div>
          {book.bookCost > 0 && <span className="text-sm text-muted">Value {currency.format(book.bookCost)}</span>}
        </div>
        <HoldAction book={book} />
      </div>
    </div>
  )
}

/** Members can queue for a book with no copy on the shelf; guests are pointed to sign in. */
function HoldAction({ book }: { book: Book }) {
  const { user } = useAuth()
  const isMember = user?.role === 'user'
  const qc = useQueryClient()
  const { data: holds } = useQuery({ ...myHoldsQuery, enabled: isMember })
  const mine = holds?.find((h) => h.bookId === book.bookId)
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: keys.books }), qc.invalidateQueries({ queryKey: keys.myHolds })])
  const place = useMutation({
    mutationFn: () => api.post<Hold>('/api/me/holds', { bookId: book.bookId }),
    onSuccess: async (h) => { await refresh(); toast.success(`Hold placed. You're number ${h.position} in line`) },
    onError: (err) => toast.error(errorMessage(err)),
  })
  const cancel = useMutation({
    mutationFn: () => api.del(`/api/me/holds/${book.bookId}`),
    onSuccess: async () => { await refresh(); toast.success('Hold cancelled') },
    onError: (err) => toast.error(errorMessage(err)),
  })

  if (mine) {
    return (
      <div className={cn('mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm',
        mine.status === 'ready' ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent')}>
        <p className="flex items-center gap-2 font-medium">
          <BookmarkCheck className="h-4 w-4" />
          {mine.status === 'ready'
            ? `A copy is waiting for you at the desk until ${formatDate(mine.readyUntil)}`
            : `You're on hold, number ${mine.position} in line`}
        </p>
        <Button variant="ghost" size="sm" loading={cancel.isPending} onClick={() => cancel.mutate()}>Cancel hold</Button>
      </div>
    )
  }
  if (availableCopies(book) > 0) return null
  if (!user) {
    return (
      <p className="mt-3 text-sm text-muted">
        All copies are out. <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link> to place a hold and get the next one.
      </p>
    )
  }
  if (!isMember) return null
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4">
      <p className="text-sm text-muted">All copies are out. Place a hold and we'll keep the next returned copy for you.</p>
      <Button size="sm" loading={place.isPending} onClick={() => place.mutate()}><Bookmark className="h-4 w-4" />Place hold</Button>
    </div>
  )
}
