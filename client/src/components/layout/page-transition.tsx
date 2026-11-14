import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

/** Soft blur-in between routes. Keyed on the first path segments so modal routes don't re-animate the page. */
export function PageTransition({ children, depth = 1 }: { children: ReactNode; depth?: number }) {
  const { pathname } = useLocation()
  const key = pathname.split('/').slice(0, depth + 1).join('/')
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
