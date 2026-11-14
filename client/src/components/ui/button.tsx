import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  // High-contrast monochrome: ink pill with a soft inner highlight
  primary: 'bg-ink text-bg hover:bg-ink/85 shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-8px_rgb(0_0_0/0.5)]',
  // Accent with glow for the single most important action on a page
  accent: 'bg-accent text-accent-ink hover:brightness-110 shadow-glow',
  secondary: 'glass text-ink hover:bg-surface-2',
  outline: 'border border-border bg-transparent text-ink hover:bg-surface-2',
  ghost: 'text-ink/80 hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110 dark:text-bg',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4.5 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'h-9 w-9',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
