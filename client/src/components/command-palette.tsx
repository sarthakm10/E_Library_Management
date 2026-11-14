import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight, BookCopy, BookOpen, Building2, CornerDownLeft, Home, LayoutDashboard, LibraryBig, LogIn, LogOut,
  Moon, PenTool, Search, UserPlus, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { BookCover } from '@/components/book-cover'
import { useBooks } from '@/lib/queries'
import { toggleTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  group: string
  label: string
  hint?: string
  icon?: LucideIcon
  cover?: { src: string; title: string }
  keywords?: string
  run: () => void
}

const Ctx = createContext<{ open: () => void }>({ open: () => {} })
export const useCommandPalette = () => useContext(Ctx)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo(() => ({ open: () => setOpen(true) }), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      <Palette open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  )
}

function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { data: books } = useBooks()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) { setQ(''); setActive(0) } }, [open])

  const go = useCallback((path: string) => () => { navigate(path); onClose() }, [navigate, onClose])

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { id: 'home', group: 'Navigate', label: 'Home', icon: Home, run: go('/') },
      { id: 'books', group: 'Navigate', label: 'Browse books', icon: LibraryBig, keywords: 'catalog search', run: go('/books') },
    ]
    if (!user) {
      pages.push(
        { id: 'login', group: 'Navigate', label: 'Sign in', icon: LogIn, run: go('/login') },
        { id: 'signup', group: 'Navigate', label: 'Create an account', icon: UserPlus, keywords: 'join register', run: go('/signup') },
      )
    }
    if (user?.role === 'user') pages.push({ id: 'profile', group: 'Navigate', label: 'My library', icon: UserRound, keywords: 'profile loans', run: go('/profile') })
    if (user?.role === 'admin') {
      pages.push(
        { id: 'a-dash', group: 'Admin', label: 'Dashboard', icon: LayoutDashboard, run: go('/admin') },
        { id: 'a-issue', group: 'Admin', label: 'Issue or return a book', icon: ArrowLeftRight, keywords: 'loan lend', run: go('/admin/issues') },
        { id: 'a-books', group: 'Admin', label: 'Book inventory', icon: BookCopy, keywords: 'add edit', run: go('/admin/books') },
        { id: 'a-members', group: 'Admin', label: 'Members', icon: Users, keywords: 'approve activate', run: go('/admin/members') },
        { id: 'a-authors', group: 'Admin', label: 'Authors', icon: PenTool, run: go('/admin/authors') },
        { id: 'a-pubs', group: 'Admin', label: 'Publishers', icon: Building2, run: go('/admin/publishers') },
      )
    }
    const actions: Item[] = [
      { id: 'theme', group: 'Actions', label: 'Toggle light / dark', icon: Moon, keywords: 'theme mode', run: () => { onClose(); setTimeout(() => toggleTheme(), 60) } },
    ]
    if (user) actions.push({ id: 'logout', group: 'Actions', label: 'Sign out', icon: LogOut, run: () => { logout(); onClose(); navigate('/') } })

    const term = q.trim().toLowerCase()
    const match = (s: string) => s.toLowerCase().includes(term)
    const bookItems: Item[] = term
      ? (books ?? [])
          .filter((b) => [b.bookName, b.authorName, b.bookId, ...b.genres].some(match))
          .slice(0, 6)
          .map((b) => ({
            id: `b-${b.bookId}`, group: 'Books', label: b.bookName,
            hint: `${b.authorName} · ${b.currentStock > 0 ? `${b.currentStock} available` : 'all out'}`,
            cover: { src: b.imageUrl, title: b.bookName }, run: go(`/books/${b.bookId}`),
          }))
      : []
    const rest = [...pages, ...actions].filter((i) => !term || match(i.label) || (i.keywords && match(i.keywords)))
    return [...bookItems, ...rest]
  }, [q, books, user, go, logout, navigate, onClose])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run() }
    else if (e.key === 'Escape') onClose()
  }

  let lastGroup = ''
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Command palette"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-elevated/95 shadow-lift backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Search books, pages and actions…"
                className="h-14 flex-1 bg-transparent text-[15px] placeholder:text-muted focus:outline-none"
                role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={items[active] ? `cmdk-${items[active].id}` : undefined}
              />
              <span className="kbd">esc</span>
            </div>
            <div ref={listRef} id="cmdk-list" role="listbox" className="no-scrollbar max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {items.length === 0 && <p className="px-3 py-10 text-center text-sm text-muted">No results for “{q}”</p>}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? (lastGroup = item.group) : null
                const Icon = item.icon ?? BookOpen
                return (
                  <div key={item.id}>
                    {header && <p className="px-3 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted">{header}</p>}
                    <button
                      id={`cmdk-${item.id}`} data-index={i} role="option" aria-selected={i === active}
                      onMouseMove={() => setActive(i)} onClick={item.run}
                      className={cn('relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                        i === active ? 'text-ink' : 'text-ink/80')}
                    >
                      {i === active && <motion.span layoutId="cmdk-active" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }} />}
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                        {item.cover ? <BookCover src={item.cover.src} title={item.cover.title} className="h-full w-full p-0 [&_p]:hidden [&_svg]:hidden" /> : <Icon className="h-4 w-4 text-muted" />}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.hint && <span className="block truncate text-xs text-muted">{item.hint}</span>}
                      </span>
                      {i === active && <CornerDownLeft className="relative h-3.5 w-3.5 text-muted" />}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
              <span className="flex items-center gap-1.5"><span className="kbd">↵</span> open</span>
              <span className="ml-auto flex items-center gap-1.5"><span className="kbd">Ctrl</span><span className="kbd">K</span> toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
