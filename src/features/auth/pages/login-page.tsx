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

// Single form with a login/signup toggle. Whether signup requires a separate
// email-confirmation step depends on this Supabase instance's
// `mailer_autoconfirm` setting, which this page does not assume either way
// (a live audit found this instance actually has it `true`, so the old
// unconditional "check your email" message was simply wrong): a successful
// `signUp()` call already tells us which case applies — Supabase returns a
// real `session` when autoconfirm is on, and `null` when it isn't — so the
// page branches on that real value instead of a hardcoded assumption.
export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
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

      const result = await signUp(email, password, name)
      if (result.error !== null) {
        setError(result.error)
        return
      }
      if (result.data.session) {
        // `mailer_autoconfirm` is on for this instance — signUp already
        // returned an active session, so there is no confirmation step to
        // wait for. Log the user in directly instead of showing a message
        // that promises a step that never happens.
        navigate('/')
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
          {mode === 'signup' && (
            <Input
              label="Nombre"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
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
