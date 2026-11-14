import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, ArrowUpRight, BookCopy, History, Building2, LayoutDashboard, LogOut, Menu, PenTool, Search, Users, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useCommandPalette } from '@/components/command-palette'
import { Aurora } from '@/components/fx/aurora'
import { Button } from '@/components/ui/button'
import { cn, initials } from '@/lib/utils'
import { Logo } from './logo'
import { PageTransition } from './page-transition'
import { ThemeToggle } from './theme-toggle'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/issues', label: 'Issue & return', icon: ArrowLeftRight },
  { to: '/admin/history', label: 'History & fines', icon: History },
  { to: '/admin/books', label: 'Inventory', icon: BookCopy },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/authors', label: 'Authors', icon: PenTool },
  { to: '/admin/publishers', label: 'Publishers', icon: Building2 },
]

function SidebarNav({ id }: { id: string }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Workspace</p>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => cn('relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'text-ink' : 'text-muted hover:text-ink')}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId={`admin-nav-${id}`} className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-border" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
              {isActive && <motion.span layoutId={`admin-bar-${id}`} className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent shadow-glow" />}
              <Icon className={cn('relative h-4 w-4', isActive && 'text-accent')} />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const palette = useCommandPalette()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [location.pathname])

  const signOut = () => {
    logout()
    navigate('/admin/login')
  }

  const footer = (
    <div className="space-y-1">
      <NavLink to="/books" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
        Public catalog <ArrowUpRight className="h-3.5 w-3.5" />
      </NavLink>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/50 p-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan text-xs font-semibold text-accent-ink">{initials(user?.name ?? 'A')}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="text-[11px] text-muted">Administrator</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <Aurora intensity="subtle" />

      <aside className="sticky top-0 hidden h-screen p-3 lg:block">
        <div className="glass flex h-full flex-col justify-between rounded-[24px] p-4 shadow-soft">
          <div className="space-y-8">
            <div className="px-1 pt-1"><Logo to="/admin" /></div>
            <SidebarNav id="desktop" />
          </div>
          {footer}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 px-3 pt-3">
          <div className="glass flex h-14 items-center justify-between gap-3 rounded-full pl-2 pr-2 shadow-soft lg:pl-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              <span className="lg:hidden"><Logo to="/admin" compact /></span>
              <button onClick={palette.open}
                className="hidden h-9 w-72 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 text-[13px] text-muted transition-colors hover:text-ink sm:flex">
                <Search className="h-3.5 w-3.5" /> Jump to a page or book…
                <span className="ml-auto flex gap-0.5"><span className="kbd">Ctrl</span><span className="kbd">K</span></span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={palette.open} aria-label="Search"><Search className="h-4 w-4" /></Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <PageTransition depth={2}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute inset-y-3 left-3 flex w-72 flex-col justify-between rounded-[24px] border border-border bg-elevated/95 p-4 shadow-lift backdrop-blur-2xl"
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between px-1"><Logo to="/admin" /><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></Button></div>
                <SidebarNav id="mobile" />
              </div>
              {footer}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
