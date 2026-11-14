import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, LogOut, Menu, Search, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useCommandPalette } from '@/components/command-palette'
import { Aurora } from '@/components/fx/aurora'
import { Button } from '@/components/ui/button'
import { cn, initials } from '@/lib/utils'
import { Logo } from './logo'
import { PageTransition } from './page-transition'
import { ThemeToggle } from './theme-toggle'

export function SiteLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const palette = useCommandPalette()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/books', label: 'Catalog' },
    ...(user?.role === 'user' ? [{ to: '/profile', label: 'My library' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  const signOut = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Aurora />

      {/* Floating pill nav */}
      <header className="fixed inset-x-0 top-3 z-40 px-3 sm:top-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn('glass mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-full pl-4 pr-2 transition-shadow duration-300',
            scrolled ? 'shadow-lift' : 'shadow-soft')}
        >
          <Logo />

          <nav className="hidden items-center md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => cn('relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink')}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-surface-2 ring-1 ring-border" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
                    <span className="relative">{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={palette.open}
              className="hidden h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-2/60 pl-3 pr-1.5 text-[13px] text-muted transition-colors hover:text-ink sm:flex">
              <Search className="h-3.5 w-3.5" /> Search
              <span className="ml-3 flex gap-0.5"><span className="kbd">Ctrl</span><span className="kbd">K</span></span>
            </button>
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={palette.open} aria-label="Search"><Search className="h-4 w-4" /></Button>
            <ThemeToggle />
            {user ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link to={user.role === 'admin' ? '/admin' : '/profile'} title={user.name}
                  className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan text-xs font-semibold text-accent-ink ring-2 ring-bg transition-transform hover:scale-105">
                  {initials(user.name)}
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link to="/signup"><Button size="sm">Join free</Button></Link>
              </div>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-3xl border border-border bg-elevated/95 p-2 shadow-lift backdrop-blur-2xl md:hidden"
            >
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => cn('flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-medium', isActive ? 'bg-surface-2 text-ink' : 'text-muted')}>
                  {l.label}<ArrowUpRight className="h-4 w-4 opacity-50" />
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border p-2 pt-3">
                {user ? (
                  <Button variant="outline" className="col-span-2" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</Button>
                ) : (
                  <>
                    <Link to="/login"><Button variant="outline" className="w-full">Sign in</Button></Link>
                    <Link to="/signup"><Button className="w-full">Join free</Button></Link>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-20 sm:pt-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="relative mt-10 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">Your neighbourhood library, re-imagined. Browse, borrow and never miss a due date.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Explore</p>
            <Link to="/books" className="block text-muted hover:text-ink">Catalog</Link>
            <Link to="/signup" className="block text-muted hover:text-ink">Become a member</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Staff</p>
            <Link to="/admin/login" className="block text-muted hover:text-ink">Staff sign in</Link>
            <button onClick={palette.open} className="block cursor-pointer text-muted hover:text-ink">Command menu <span className="kbd ml-1">Ctrl K</span></button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted sm:px-6">© {new Date().getFullYear()} Shelfwise E-Library</div>
        <p aria-hidden className="pointer-events-none select-none overflow-hidden text-center font-serif text-[22vw] leading-[0.75] tracking-tight text-ink/[0.04] italic">Shelfwise</p>
      </footer>
    </div>
  )
}
