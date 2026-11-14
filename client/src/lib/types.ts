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
  /** Copies on the shelf kept aside for members whose holds are ready. */
  reserved: number
  /** Members queued for this book. */
  waiting: number
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
  renewCount: number
  /** Fine owed if returned today (₹). */
  fine: number
  /** Why it can't be renewed, or null when it can. */
  renewBlock: string | null
}

export type HoldStatus = 'waiting' | 'ready'

export interface Hold {
  memberId: string
  memberName: string
  bookId: string
  bookName: string
  imageUrl: string
  placedAt: string
  status: HoldStatus
  readyUntil: string | null
  /** Place in line among waiting holds (1 = next); 0 when ready. */
  position: number
}

export interface HistoryEntry {
  id: number
  memberId: string
  memberName: string
  bookId: string
  bookName: string
  issueDate: string
  dueDate: string
  returnDate: string
  renewCount: number
  daysLate: number
  fine: number
  finePaid: boolean
}

export interface ReturnResult {
  bookName: string
  memberName: string
  daysLate: number
  fine: number
  /** Name of the member whose hold this return made ready, if any. */
  holdReadyFor: string | null
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
  /** Copies kept aside for other members' ready holds. */
  reserved: number | null
  memberName: string | null
  memberStatus: AccountStatus | null
  alreadyIssued: boolean
  /** This member's hold on this book, if any. */
  holdStatus: HoldStatus | null
  unpaidFines: number
}
