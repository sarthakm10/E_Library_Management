import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { STATES } from '@/lib/constants'
import type { MemberDetails } from '@/lib/schemas'

interface Props {
  register: UseFormRegister<any>
  errors: FieldErrors<MemberDetails>
  section?: 'personal' | 'address' | 'all'
}

/** Personal + address inputs shared by signup and profile. */
export function MemberFields({ register, errors, section = 'all' }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {section !== 'address' && <>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} className="sm:col-span-2">
          <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register('fullName')} />
        </Field>
        <Field label="Date of birth" htmlFor="dob" error={errors.dob?.message}>
          <Input id="dob" type="date" aria-invalid={!!errors.dob} {...register('dob')} />
        </Field>
        <Field label="Contact number" htmlFor="contactNo" error={errors.contactNo?.message}>
          <Input id="contactNo" type="tel" autoComplete="tel" aria-invalid={!!errors.contactNo} {...register('contactNo')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message} className="sm:col-span-2">
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
      </>}
      {section !== 'personal' && <>
        <Field label="State" htmlFor="state" error={errors.state?.message}>
          <Select id="state" aria-invalid={!!errors.state} {...register('state')}>
            <option value="">Select a state</option>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register('city')} />
        </Field>
        <Field label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
          <Input id="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" aria-invalid={!!errors.pincode} {...register('pincode')} />
        </Field>
        <Field label="Full address" htmlFor="fullAddress" error={errors.fullAddress?.message} className="sm:col-span-2">
          <Textarea id="fullAddress" rows={2} autoComplete="street-address" aria-invalid={!!errors.fullAddress} {...register('fullAddress')} />
        </Field>
      </>}
    </div>
  )
}
