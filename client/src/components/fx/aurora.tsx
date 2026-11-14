import { cn } from '@/lib/utils'

/** Fixed, slowly drifting aurora + grid + film grain behind the whole app. */
export function Aurora({ intensity = 'normal' }: { intensity?: 'normal' | 'subtle' }) {
  const o = intensity === 'subtle' ? 'opacity-50 dark:opacity-60' : 'opacity-70 dark:opacity-100'
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={cn('absolute inset-0', o)}>
        <div className="absolute -left-[10%] -top-[20%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgb(139_92_246/0.35),transparent_65%)] will-change-transform [animation:aurora-a_22s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgb(139_92_246/0.28),transparent_65%)]" />
        <div className="absolute -right-[15%] top-[10%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgb(34_211_238/0.22),transparent_65%)] will-change-transform [animation:aurora-b_26s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgb(34_211_238/0.16),transparent_65%)]" />
        <div className="absolute bottom-[-25%] left-[25%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle,rgb(190_242_100/0.18),transparent_65%)] will-change-transform [animation:aurora-c_30s_ease-in-out_infinite] dark:bg-[radial-gradient(circle,rgb(190_242_100/0.08),transparent_65%)]" />
      </div>
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000,transparent)] dark:opacity-60" />
      <div className="grain absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" />
    </div>
  )
}
