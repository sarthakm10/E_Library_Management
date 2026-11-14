import { useEffect, useState } from 'react'

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#060609' : '#f6f6f8')
  try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
}

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

/** Switches theme with a circular reveal from (x, y) where supported. */
export function toggleTheme(origin?: { x: number; y: number }) {
  const next = !isDark()
  const doc = document as ViewTransitionDoc
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) return apply(next)

  const x = origin?.x ?? innerWidth / 2
  const y = origin?.y ?? 0
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  doc.startViewTransition(() => apply(next)).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}

/** Re-renders when the theme class on <html> changes. */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(isDark)
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}
