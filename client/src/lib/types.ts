export type Role = 'admin' | 'user'
export type AccountStatus = 'active' | 'pending' | 'deactive'

export interface SessionUser {
  id: string
  name: string
  role: Role
  status: AccountStatus
}

export interface Book {
  bookId: string
  bookName: string
  genres: string[]
  authorName: string
  publisherName: string
  publishDate: string
  language: string
  edition: string
  bookCost: number
  pages: number
  description: string
  actualStock: number
  currentStock: number
  imageLink: string
  imageUrl: string
}

export interface CatalogEntry {
  id: string
  name: string
  bookCount: number
}

export interface Member {
  memberId: string
  fullName: string
  dob: string
  contactNo: string
  email: string
  state: string
  city: string
  pincode: string
  fullAddress: string
  accountStatus: AccountStatus
}

export interface Issue {
  memberId: string
  memberName: string
  bookId: string
  bookName: string
  issueDate: string
  dueDate: string
  daysLeft: number | null
  overdue: boolean
}

export interface NameCount {
  name: string
  count: number
}

export interface Dashboard {
  titles: number
  totalCopies: number
  availableCopies: number
  issuedCopies: number
  members: number
  membersByStatus: Record<AccountStatus, number>
  overdueCount: number
  overdue: Issue[]
  dueSoon: Issue[]
  genres: NameCount[]
  topBorrowed: NameCount[]
  pendingMembers: Member[]
}

export interface PublicStats {
  titles: number
  copies: number
  members: number
  genres: number
}

export interface IssueLookup {
  bookName: string | null
  available: number | null
  memberName: string | null
  memberStatus: AccountStatus | null
  alreadyIssued: boolean
}
