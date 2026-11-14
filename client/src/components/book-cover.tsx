import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Cloth-binding colours for generated covers: deep, distinct, all readable with white text. */
const PALETTE: [string, string][] = [
  ['#9a3412', '#431407'], // rust
  ['#166534', '#052e16'], // forest
  ['#1e3a8a', '#0b1533'], // navy
  ['#7e22ce', '#2e1065'], // plum
  ['#a16207', '#422006'], // ochre
  ['#0f766e', '#042f2e'], // teal
  ['#be123c', '#4c0519'], // crimson
  ['#334155', '#0f172a'], // slate
]

/** Book cover image with a generated fallback when the image is missing or is the legacy placeholder. */
export function BookCover({ src, title, className }: { src?: string; title: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const placeholder = !src || failed || src.endsWith('/books1.png') || src.endsWith('/books1')

  if (placeholder) {
    const hash = [...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
    const [from, to] = PALETTE[hash % PALETTE.length]
    return (
      <div
        className={cn('relative flex flex-col justify-between overflow-hidden p-4 text-white', className)}
        style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      >
        <div className="absolute inset-y-0 left-2 w-px bg-white/25" />
        <BookOpen className="h-5 w-5 opacity-70" />
        <p className="line-clamp-4 font-display text-lg font-semibold leading-tight drop-shadow">{title}</p>
      </div>
    )
  }
  return <img src={src} alt={`Cover of ${title}`} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cn('object-cover', className)} />
}
