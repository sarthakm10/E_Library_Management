import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import type { Role } from '@/lib/types'

/** Client-side guard for nicer UX. The API enforces the same rules on every request. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
  }
  if (!user || user.role !== role) {
    const to = role === 'admin' ? '/admin/login' : '/login'
    return <Navigate to={to} replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
