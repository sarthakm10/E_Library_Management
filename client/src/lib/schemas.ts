import { z } from 'zod'

export const memberDetailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  dob: z.string().min(1, 'Date of birth is required').refine((v) => new Date(v) < new Date(), 'Date of birth must be in the past'),
  contactNo: z.string().trim().regex(/^[0-9+ -]{7,15}$/, 'Enter a valid contact number'),
  email: z.string().trim().email('Enter a valid email'),
  state: z.string().min(1, 'Pick a state'),
  city: z.string().trim().min(1, 'City is required'),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  fullAddress: z.string().trim().min(1, 'Address is required').max(500),
})

export const credentialsSchema = z.object({
  memberId: z.string().trim().regex(/^[A-Za-z0-9_.-]{3,30}$/, '3–30 letters, numbers, . _ or -'),
  password: z.string().min(6, 'At least 6 characters').max(50),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ['confirm'] })

export type MemberDetails = z.infer<typeof memberDetailsSchema>
