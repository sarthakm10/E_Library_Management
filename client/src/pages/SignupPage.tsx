import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, KeyRound, MapPin, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { AuthShell } from '@/components/auth-shell'
import { MemberFields } from '@/components/member-fields'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { api, ApiError, errorMessage } from '@/lib/api'
import { credentialsSchema, memberDetailsSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

const schema = memberDetailsSchema.and(credentialsSchema)
type Values = z.infer<typeof schema>

const steps = [
  { title: 'About you', icon: UserRound, fields: ['fullName', 'dob', 'contactNo', 'email'] },
  { title: 'Address', icon: MapPin, fields: ['state', 'city', 'pincode', 'fullAddress'] },
  { title: 'Sign-in details', icon: KeyRound, fields: ['memberId', 'password', 'confirm'] },
] as const

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { loginMember } = useAuth()
  const { register, handleSubmit, trigger, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  const next = async () => {
    if (await trigger(steps[step].fields as unknown as (keyof Values)[])) setStep((s) => s + 1)
  }

  const onSubmit = async ({ confirm: _confirm, ...values }: Values) => {
    try {
      await api.post('/api/auth/signup', values)
      await loginMember(values.memberId, values.password)
      toast.success('Welcome to Shelfwise!', { description: 'An admin will activate your membership soon.' })
      navigate('/profile')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('memberId', { message: err.message })
        setStep(2)
      }
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthShell>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">Join the <span className="text-gradient font-serif font-normal italic">library</span></h1>
          <p className="mt-2 text-muted">Free membership. Takes about a minute.</p>
        </div>

        {/* Stepper */}
        <ol className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center gap-2">
              <div className={cn('flex items-center gap-2 text-sm font-medium', i <= step ? 'text-ink' : 'text-muted')}>
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs transition-colors',
                  i < step ? 'border-accent bg-accent text-accent-ink' : i === step ? 'border-accent text-accent' : 'border-border')}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={cn('h-px flex-1 transition-colors', i < step ? 'bg-accent' : 'bg-border')} />}
            </li>
          ))}
        </ol>

        <Card className="overflow-hidden rounded-[28px] p-6 shadow-lift sm:p-7">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <h2 className="mb-5 flex items-center gap-2 font-sans text-lg font-semibold">
                  {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-accent" /> })()}
                  {steps[step].title}
                </h2>
                {step === 0 && <MemberFields register={register} errors={errors} section="personal" />}
                {step === 1 && <MemberFields register={register} errors={errors} section="address" />}
                {step === 2 && (
                  <div className="grid gap-4">
                    <Field label="Member ID" htmlFor="memberId" error={errors.memberId?.message} hint="You'll use this to sign in and at the desk.">
                      <Input id="memberId" autoComplete="username" aria-invalid={!!errors.memberId} {...register('memberId')} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Password" htmlFor="password" error={errors.password?.message}>
                        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
                      </Field>
                      <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
                        <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />
                      </Field>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0
                ? <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" />Back</Button>
                : <Link to="/login" className="text-sm text-muted hover:text-ink">Have an account? <span className="font-medium text-accent">Sign in</span></Link>}
              {step < steps.length - 1
                ? <Button onClick={next}>Continue<ArrowRight className="h-4 w-4" /></Button>
                : <Button type="submit" variant="accent" loading={isSubmitting}>Create account</Button>}
            </div>
          </form>
        </Card>
      </div>
    </AuthShell>
  )
}
