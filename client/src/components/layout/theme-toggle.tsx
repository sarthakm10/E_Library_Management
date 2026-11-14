import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleTheme, useIsDark } from '@/lib/theme'

export function ThemeToggle() {
  const dark = useIsDark()
  return (
    <Button
      variant="ghost" size="icon"
      onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'sun' : 'moon'} initial={{ y: -14, opacity: 0, rotate: -60 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 14, opacity: 0, rotate: 60 }} transition={{ duration: 0.2 }}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
