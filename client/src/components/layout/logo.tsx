import { Link } from 'react-router-dom'

/** Stacked-spines mark + wordmark. */
export function Logo({ to = '/', compact }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label="Shelfwise home">
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg shadow-soft transition-transform duration-300 group-hover:rotate-[-6deg]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <rect x="4" y="5" width="3.2" height="14" rx="1" fill="currentColor" />
          <rect x="8.6" y="3.5" width="3.2" height="15.5" rx="1" fill="currentColor" opacity=".75" />
          <rect x="13.4" y="6" width="3.2" height="13" rx="1" transform="rotate(-14 15 12.5)" fill="currentColor" opacity=".5" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent shadow-glow" />
      </span>
      {!compact && <span className="text-[17px] font-semibold tracking-tight">Shelfwise</span>}
    </Link>
  )
}
