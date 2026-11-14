import { useRef, type ReactNode, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'

/**
 * 3D tilt with a moving glare, for book covers. Mouse-only; does nothing on touch.
 * Writes CSS variables straight to the element (no React re-renders, no animation library),
 * so hundreds of these on one page cost nothing until one is hovered.
 */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${(x - 0.5) * 2 * max}deg`)
      el.style.setProperty('--rx', `${(0.5 - y) * 2 * max}deg`)
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
    })
  }
  const leave = () => {
    cancelAnimationFrame(frame.current)
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div ref={ref} className={cn('group/tilt [perspective:900px]', className)} onPointerMove={move} onPointerLeave={leave}>
      <div className="relative h-full w-full transition-transform duration-200 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] group-hover/tilt:duration-75">
        {children}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [background:radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgb(255_255_255/0.28),transparent_55%)] group-hover/tilt:opacity-100" />
      </div>
    </div>
  )
}
