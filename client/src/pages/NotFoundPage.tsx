import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-semibold text-accent">404</p>
        <h1 className="mt-3 text-2xl font-semibold">This page is checked out</h1>
        <p className="mt-2 text-muted">We couldn't find what you were looking for.</p>
        <Link to="/" className="mt-6 inline-block"><Button>Back to home</Button></Link>
      </div>
    </div>
  )
}
