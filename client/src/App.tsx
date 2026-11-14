import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { RequireRole } from '@/auth/RequireRole'
import { SiteLayout } from '@/components/layout/site-layout'
import { AdminLayout } from '@/components/layout/admin-layout'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Signed-in areas load on demand to keep the public bundle small.
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const BooksAdminPage = lazy(() => import('@/pages/admin/BooksAdminPage'))
const IssuesPage = lazy(() => import('@/pages/admin/IssuesPage'))
const MembersPage = lazy(() => import('@/pages/admin/MembersPage'))
const CatalogAdminPage = lazy(() => import('@/pages/admin/CatalogAdminPage'))

const fallback = <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>

export function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="books" element={<CatalogPage />} />
          <Route path="books/:bookId" element={<CatalogPage />} />
          <Route path="login" element={<LoginPage mode="user" />} />
          <Route path="admin/login" element={<LoginPage mode="admin" />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="profile" element={<RequireRole role="user"><ProfilePage /></RequireRole>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
          <Route index element={<DashboardPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="books" element={<BooksAdminPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="authors" element={<CatalogAdminPage kind="authors" />} />
          <Route path="publishers" element={<CatalogAdminPage kind="publishers" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
