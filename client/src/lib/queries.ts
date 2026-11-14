import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { Book, CatalogEntry, Dashboard, HistoryEntry, Hold, Issue, Member, PublicStats } from './types'

export const keys = {
  books: ['books'] as const,
  book: (id: string) => ['books', id] as const,
  authors: ['authors'] as const,
  publishers: ['publishers'] as const,
  stats: ['stats'] as const,
  dashboard: ['dashboard'] as const,
  members: ['members'] as const,
  issues: ['issues'] as const,
  profile: ['me', 'profile'] as const,
  myIssues: ['me', 'issues'] as const,
  myHolds: ['me', 'holds'] as const,
  myHistory: ['me', 'history'] as const,
  holds: ['holds'] as const,
  history: ['history'] as const,
}

export const useBooks = () => useQuery({ queryKey: keys.books, queryFn: () => api.get<Book[]>('/api/books') })
export const useAuthors = () => useQuery({ queryKey: keys.authors, queryFn: () => api.get<CatalogEntry[]>('/api/authors') })
export const usePublishers = () => useQuery({ queryKey: keys.publishers, queryFn: () => api.get<CatalogEntry[]>('/api/publishers') })
export const usePublicStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.get<PublicStats>('/api/stats') })
export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: () => api.get<Dashboard>('/api/admin/dashboard') })
export const useMembers = () => useQuery({ queryKey: keys.members, queryFn: () => api.get<Member[]>('/api/admin/members') })
export const useIssues = () => useQuery({ queryKey: keys.issues, queryFn: () => api.get<Issue[]>('/api/admin/issues') })
export const useProfile = () => useQuery({ queryKey: keys.profile, queryFn: () => api.get<Member>('/api/me/profile') })
export const useMyIssues = () => useQuery({ queryKey: keys.myIssues, queryFn: () => api.get<Issue[]>('/api/me/issues') })
export const myHoldsQuery = { queryKey: keys.myHolds, queryFn: () => api.get<Hold[]>('/api/me/holds') }
export const useMyHolds = () => useQuery(myHoldsQuery)
export const useMyHistory = () => useQuery({ queryKey: keys.myHistory, queryFn: () => api.get<HistoryEntry[]>('/api/me/history') })
export const useHolds = () => useQuery({ queryKey: keys.holds, queryFn: () => api.get<Hold[]>('/api/admin/holds') })
export const useHistory = () => useQuery({ queryKey: keys.history, queryFn: () => api.get<HistoryEntry[]>('/api/admin/history') })
