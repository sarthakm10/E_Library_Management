import { forwardRef, type HTMLAttributes, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

/** Glass card whose hover highlight follows the pointer. */
export const SpotlightCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, onMouseMove, ...props }, ref) => {
    const move = (e: MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      onMouseMove?.(e)
    }
    return (
      <div
        ref={ref}
        onMouseMove={move}
        className={cn('glass spotlight rounded-[var(--radius-card)] shadow-soft transition-colors hover:border-accent/30', className)}
        {...props}
      />
    )
  },
)
SpotlightCard.displayName = 'SpotlightCard'
