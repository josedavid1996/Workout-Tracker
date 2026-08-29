import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { Tabs } from '../../../shared/ui/tabs'
import { signIn, signUp } from '../api/auth'

type Mode = 'login' | 'signup'

const modeTabs = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'signup', label: 'Crear cuenta' },
]

// Single form with a login/signup toggle. Signup on this instance always
// requires email confirmation (mailer_autoconfirm is off), so a successful
// signUp never logs the user in directly — it shows a "check your email"
// message instead of navigating away.
export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleModeChange(id: string) {
    setMode(id as Mode)
    setError(null)
    setSignupSuccess(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await signIn(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        navigate('/')
        return
      }

      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error)
        return
      }
      setSignupSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-6 text-center font-display text-2xl uppercase tracking-wide text-foreground">
          Workout Tracker
        </h1>

        <Tabs tabs={modeTabs} value={mode} onChange={handleModeChange} />

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {signupSuccess && (
            <p className="text-sm text-positive">
              Revisá tu email para confirmar tu cuenta antes de iniciar sesión.
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
