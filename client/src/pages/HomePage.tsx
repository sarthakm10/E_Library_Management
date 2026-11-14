import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BellRing, Command, Library, MoonStar, Search, Smartphone, Sparkles } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { BookCover } from '@/components/book-cover'
import { useCommandPalette } from '@/components/command-palette'
import { AnimatedNumber } from '@/components/fx/animated-number'
import { Reveal } from '@/components/fx/reveal'
import { SpotlightCard } from '@/components/fx/spotlight'
import { Button } from '@/components/ui/button'
import { useBooks, usePublicStats } from '@/lib/queries'
import { toggleTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/types'

const ease = [0.16, 1, 0.3, 1] as const

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const palette = useCommandPalette()
  const [q, setQ] = useState('')
  const { data: stats } = usePublicStats()
  const { data: books } = useBooks()

  const search = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/books?q=${encodeURIComponent(q.trim())}` : '/books')
  }

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Link to="/books?available=1" className="glow-border glass inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[13px] text-muted transition-colors hover:text-ink">
            <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-accent" /></span>
              LIVE
            </span>
            See what's on the shelf right now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        <h1 className="mx-auto mt-8 max-w-4xl text-[clamp(2.6rem,8vw,6.2rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          {['Every', 'book,'].map((w, i) => (
            <motion.span key={w} className="text-fade inline-block pr-[0.22em]" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}>{w}</motion.span>
          ))}
          <br />
          <motion.span className="text-gradient inline-block pr-[0.15em] font-serif font-normal italic tracking-[-0.02em]" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.28, ease }}>
            one search
          </motion.span>
          <motion.span className="text-fade inline-block" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.36, ease }}>away.</motion.span>
        </h1>

        <motion.p className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
          Browse the whole collection, see live availability, and track every loan with due-date reminders. Your library, finally at internet speed.
        </motion.p>

        <motion.form onSubmit={search} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease }}
          className="glass mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full p-1.5 shadow-lift">
          <Search className="ml-3 h-5 w-5 shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, authors, genres…" aria-label="Search books"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-muted focus:outline-none" />
          <button type="button" onClick={palette.open} className="hidden cursor-pointer items-center gap-0.5 sm:flex" aria-label="Open command menu"><span className="kbd">Ctrl</span><span className="kbd">K</span></button>
          <Button type="submit" size="lg" className="h-11">Search</Button>
        </motion.form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-5 flex flex-wrap justify-center gap-2 text-[13px] text-muted">
          <span>Try</span>
          {['Self Help', 'Crime', 'History'].map((g) => (
            <Link key={g} to={`/books?genre=${encodeURIComponent(g)}`} className="rounded-full border border-border px-2.5 py-0.5 transition-colors hover:border-accent/40 hover:text-ink">{g}</Link>
          ))}
        </motion.div>
      </section>

      {/* ───────── Cover wall ───────── */}
      <CoverWall books={books} />

      {/* ───────── Stats ───────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="glass grid grid-cols-2 divide-border overflow-hidden rounded-[28px] shadow-soft sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-border sm:[&>*:nth-child(-n+2)]:border-b-0">
            {[
              ['Titles', stats?.titles],
              ['Copies', stats?.copies],
              ['Genres', stats?.genres],
              ['Readers', stats?.members],
            ].map(([label, value]) => (
              <div key={label as string} className="px-6 py-7 text-center">
                <AnimatedNumber value={value as number | undefined} className="block text-4xl font-semibold tracking-tighter sm:text-5xl" />
                <p className="mt-1 text-[13px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───────── Bento ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-accent">Why Shelfwise</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tighter sm:text-5xl">A library that <span className="font-serif font-normal italic">feels</span> like an app</h2>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4 md:row-span-2"><LiveShelf books={books} /></Reveal>
          <Reveal delay={0.05} className="md:col-span-2">
            <SpotlightCard className="flex h-full cursor-pointer flex-col justify-between p-6" onClick={palette.open}>
              <BentoTitle icon={Command} title="Search in a keystroke" text="Hit Ctrl K anywhere to jump to any book or page." />
              <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-3">
                <div className="flex items-center gap-2 text-sm"><Search className="h-3.5 w-3.5 text-muted" /><span className="shimmer-text font-medium">think and gro</span><span className="h-4 w-px animate-pulse bg-accent" /></div>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface-2 px-2 py-1.5 text-xs"><span className="h-5 w-4 rounded-sm bg-gradient-to-br from-lime to-cyan" />Think and Grow Rich<span className="ml-auto text-muted">↵</span></div>
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-2">
            <SpotlightCard className="flex h-full flex-col justify-between p-6">
              <BentoTitle icon={BellRing} title="Never miss a due date" text="Countdowns on every loan. Overdue books flagged, kindly." />
              <DueRing />
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.05} className="md:col-span-3"><GenreCloud books={books} /></Reveal>
          <Reveal delay={0.1} className="md:col-span-3">
            <SpotlightCard className="grid h-full grid-cols-2 gap-4 p-6">
              <div className="flex flex-col justify-between">
                <BentoTitle icon={MoonStar} title="Day or night" text="A reading room that adapts to you." />
                <Button variant="secondary" size="sm" className="mt-4 self-start" onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}>Flip the lights</Button>
              </div>
              <div className="flex flex-col justify-between">
                <BentoTitle icon={Smartphone} title="Pocket-sized" text="Every screen works beautifully on your phone." />
                <div className="mt-4 h-16 w-10 self-start rounded-xl border-2 border-ink/20 p-1"><div className="h-full rounded-md bg-gradient-to-b from-accent/60 to-cyan/40" /></div>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* ───────── Steps ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-[28px] border border-border bg-border md:grid-cols-3">
          {[
            ['01', 'Join in a minute', 'Create a free membership with just the basics.'],
            ['02', 'Find your book', 'Search, filter by genre or language, check the shelf live.'],
            ['03', 'Pick it up', 'Show your member ID at the desk. We track the rest.'],
          ].map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.08} className="h-full">
              <div className="h-full bg-bg/80 p-8 backdrop-blur-xl">
                <p className="text-gradient font-serif text-6xl italic">{n}</p>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="glow-border glass relative overflow-hidden rounded-[36px] px-6 py-20 text-center shadow-lift sm:px-12">
            <div className="absolute inset-x-0 -top-40 mx-auto h-80 w-[40rem] rounded-full bg-accent/25 blur-[100px]" />
            <h2 className="relative mx-auto max-w-3xl text-[clamp(2.2rem,6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.04em]">
              Your next chapter <span className="text-gradient font-serif font-normal italic">starts here.</span>
            </h2>
            <p className="relative mx-auto mt-5 max-w-md text-muted">
              {user ? 'Jump into the catalog and see what is on the shelf today.' : 'Free membership. Thousands of pages. Zero late-fee surprises.'}
            </p>
            <div className="relative mt-10 flex flex-wrap justify-center gap-3">
              <Link to={user ? '/books' : '/signup'}><Button size="lg" variant="accent">{user ? 'Browse the catalog' : 'Create free account'}<ArrowRight className="h-4 w-4" /></Button></Link>
              {!user && <Link to="/books"><Button size="lg" variant="secondary">Just browsing</Button></Link>}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}

function BentoTitle({ icon: Icon, title, text }: { icon: typeof Library; title: string; text: string }) {
  return (
    <div>
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 text-accent"><Icon className="h-4 w-4" /></span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  )
}

/** Two counter-scrolling rows of covers on a tilted plane. */
function CoverWall({ books }: { books?: Book[] }) {
  const row = useMemo(() => {
    if (!books?.length) return []
    const out: Book[] = []
    while (out.length < 12) out.push(...books)
    return out.slice(0, 12)
  }, [books])
  if (!row.length) return <div className="h-[340px]" />

  const Row = ({ items, reverse }: { items: Book[]; reverse?: boolean }) => (
    <div className="flex w-max gap-5 hover:[animation-play-state:paused]" style={{ animation: `marquee ${reverse ? 70 : 55}s linear infinite${reverse ? ' reverse' : ''}` }}>
      {[...items, ...items].map((b, i) => (
        <Link key={i} to={`/books/${b.bookId}`} tabIndex={i >= items.length ? -1 : undefined} className="block w-36 shrink-0 transition-transform duration-500 hover:-translate-y-2 hover:scale-[1.04] sm:w-44">
          <BookCover src={b.imageUrl} title={b.bookName} className="aspect-[2/3] w-full rounded-2xl shadow-lift ring-1 ring-white/10" />
        </Link>
      ))}
    </div>
  )

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1 }} className="relative -mt-4 overflow-hidden py-14 [perspective:1400px]" aria-label="Featured books">
      <div className="mask-fade-x space-y-5 [transform:rotateX(18deg)_rotateZ(-4deg)] [transform-origin:center]">
        <Row items={row} />
        <Row items={[...row].reverse()} reverse />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
    </motion.section>
  )
}

function LiveShelf({ books }: { books?: Book[] }) {
  const list = (books ?? []).slice(0, 5)
  return (
    <SpotlightCard className="flex h-full flex-col p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <BentoTitle icon={Library} title="The shelf, live" text="Real availability for every title, updated the moment a book is issued or returned." />
        <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />Live
        </span>
      </div>
      <ul className="mt-8 flex-1 space-y-3">
        {list.map((b, i) => {
          const pct = b.actualStock ? (b.currentStock / b.actualStock) * 100 : 0
          return (
            <motion.li key={b.bookId} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={`/books/${b.bookId}`} className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-surface-2">
                <BookCover src={b.imageUrl} title={b.bookName} className="h-14 w-10 shrink-0 rounded-md p-0 [&_p]:hidden [&_svg]:hidden" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-accent">{b.bookName}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div className={cn('h-full rounded-full', pct === 0 ? 'bg-danger' : 'bg-gradient-to-r from-accent to-cyan')}
                      initial={{ width: 0 }} whileInView={{ width: `${Math.max(pct, 4)}%` }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.2 + i * 0.06, ease }} />
                  </div>
                </div>
                <p className="w-16 text-right text-xs tabular-nums text-muted"><span className="font-semibold text-ink">{b.currentStock}</span>/{b.actualStock}</p>
              </Link>
            </motion.li>
          )
        })}
      </ul>
      <Link to="/books" className="mt-4 inline-flex items-center gap-1 self-start text-sm font-medium text-accent hover:underline">Open the full catalog <ArrowRight className="h-3.5 w-3.5" /></Link>
    </SpotlightCard>
  )
}

function DueRing() {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="mt-5 flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-surface-2" strokeWidth="7" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke="url(#ring)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * 0.22 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }} />
        <defs><linearGradient id="ring"><stop offset="0" stopColor="var(--color-accent)" /><stop offset="1" stopColor="var(--color-cyan)" /></linearGradient></defs>
      </svg>
      <div>
        <p className="text-2xl font-semibold tracking-tight">3 days</p>
        <p className="text-xs text-muted">left on Think and Grow Rich</p>
      </div>
    </div>
  )
}

function GenreCloud({ books }: { books?: Book[] }) {
  const genres = useMemo(() => {
    const m = new Map<string, number>()
    books?.forEach((b) => b.genres.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [books])
  return (
    <SpotlightCard className="flex h-full flex-col justify-between p-6">
      <BentoTitle icon={Sparkles} title="Every mood, one shelf" text="Jump straight into a genre." />
      <div className="mt-5 flex flex-wrap gap-2">
        {genres.map(([g, n], i) => (
          <motion.div key={g} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03, type: 'spring', bounce: 0.4 }}>
            <Link to={`/books?genre=${encodeURIComponent(g)}`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-[13px] transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow">
              {g}<span className="text-[11px] text-muted">{n}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </SpotlightCard>
  )
}
