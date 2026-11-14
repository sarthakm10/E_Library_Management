import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

/** Counts up to `value` when it scrolls into view. */
export function AnimatedNumber({ value, className }: { value: number | undefined; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || value === undefined || !ref.current) return
    const node = ref.current
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = Math.round(v).toLocaleString('en-IN') },
    })
    return () => controls.stop()
  }, [inView, value])

  return <span ref={ref} className={className}>{value === undefined ? '—' : 0}</span>
}
