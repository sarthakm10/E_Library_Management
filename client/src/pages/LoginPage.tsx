import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

const schema = z.object({
  id: z.string().trim().min(1, 'Enter your ID'),
  password: z.string().min(1, 'Enter your password'),
})
type Values = z.infer<typeof schema>

export function LoginPage({ mode }: { mode: 'user' | 'admin' }) {
  const isAdmin = mode === 'admin'
  const { loginAdmin, loginMember } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ id, password }: Values) => {
    try {
      const user = await (isAdmin ? loginAdmin(id, password) : loginMember(id, password))
      toast.success(`Welcome back, ${user.role === 'admin' ? user.name : user.name.split(' ')[0]}!`)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (isAdmin ? '/admin' : '/books'), { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthShell>
      <div className="relative mb-8 grid grid-cols-2 rounded-full border border-border bg-surface-2/60 p-1">
        {([['user', '/login', 'Member', UserRound], ['admin', '/admin/login', 'Staff', ShieldCheck]] as const).map(([m, to, label, Icon]) => (
          <Link key={m} to={to} replace className={cn('relative flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors', mode === m ? 'text-bg' : 'text-muted hover:text-ink')}>
            {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
            <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
          </Link>
        ))}
      </div>

      <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
        {isAdmin ? <>Staff <span className="font-serif font-normal italic">desk</span></> : <>Welcome <span className="text-gradient font-serif font-normal italic">back</span></>}
      </h1>
      <p className="mt-2 text-muted">{isAdmin ? 'Manage books, members and loans.' : 'Sign in to see your loans and due dates.'}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label={isAdmin ? 'Username' : 'Member ID'} htmlFor="id" error={errors.id?.message}>
          <Input id="id" autoComplete="username" aria-invalid={!!errors.id} className="h-12" {...register('id')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" aria-invalid={!!errors.password} className="h-12 pr-11" {...register('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" variant="accent" className="mt-2 w-full" loading={isSubmitting}>Sign in <ArrowRight className="h-4 w-4" /></Button>
      </form>

      {!isAdmin && (
        <p className="mt-8 text-center text-sm text-muted">
          New here? <Link to="/signup" className="font-medium text-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent">Create a free account</Link>
        </p>
      )}
    </AuthShell>
  )
}
