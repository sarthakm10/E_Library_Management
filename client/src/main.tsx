import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/auth/AuthContext'
import { CommandPaletteProvider } from '@/components/command-palette'
import { ErrorBoundary } from '@/components/error-boundary'
import { useIsDark } from '@/lib/theme'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (count, err) => count < 1 && (err as { status?: number }).status !== 401, refetchOnWindowFocus: false },
  },
})

function ThemedToaster() {
  const dark = useIsDark()
  return (
    <Toaster
      position="bottom-right"
      theme={dark ? 'dark' : 'light'}
      toastOptions={{ className: '!rounded-2xl !border-border !bg-elevated/90 !backdrop-blur-xl !shadow-lift !font-sans' }}
      richColors
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CommandPaletteProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
              <ThemedToaster />
            </CommandPaletteProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
)
