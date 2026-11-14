import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BookCover } from '@/components/book-cover'
import { useBooks } from '@/lib/queries'

/** Split layout for sign-in and sign-up: floating cover art on the left, form on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { data: books } = useBooks()
  const covers = (books ?? []).slice(0, 3)
  const spots = [
    { x: '8%', y: '14%', r: -10, d: 0 },
    { x: '46%', y: '6%', r: 6, d: 0.8 },
    { x: '26%', y: '42%', r: -2, d: 1.6 },
  ]

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <div className="glass relative hidden h-[600px] overflow-hidden rounded-[32px] shadow-lift lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--color-accent)_30%,transparent),transparent_60%),radial-gradient(ellipse_at_80%_90%,color-mix(in_oklab,var(--color-cyan)_22%,transparent),transparent_55%)]" />
        <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]" />
        {covers.map((b, i) => (
          <motion.div key={b.bookId} className="absolute w-40"
            style={{ left: spots[i].x, top: spots[i].y }}
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            animate={{ opacity: 1, y: [0, -12, 0], rotate: spots[i].r }}
            transition={{ opacity: { delay: 0.2 + i * 0.12 }, rotate: { delay: 0.2 + i * 0.12, type: 'spring' }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: spots[i].d } }}>
            <BookCover src={b.imageUrl} title={b.bookName} className="aspect-[2/3] w-full rounded-2xl shadow-lift ring-1 ring-white/15" />
          </motion.div>
        ))}
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-serif text-3xl italic leading-tight">“A reader lives a thousand lives before he dies.”</p>
          <p className="mt-3 text-sm text-muted">— George R. R. Martin</p>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-full max-w-md">
        {children}
      </motion.div>
    </div>
  )
}
