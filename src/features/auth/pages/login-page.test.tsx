import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

import { signIn, signUp } from '../api/auth'
import { LoginPage } from './login-page'

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset()
    vi.mocked(signUp).mockReset()
  })

  it('defaults to login mode and submits via signIn', async () => {
    vi.mocked(signIn).mockResolvedValue({ data: { user: {}, session: {} } as never, error: null })

    renderPage()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.com', 'password123'))
    expect(signUp).not.toHaveBeenCalled()
  })

  it('switches to signup mode, shows a Nombre field, and passes it to signUp', async () => {
    vi.mocked(signUp).mockResolvedValue({ data: { user: {}, session: null } as never, error: null })

    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /crear cuenta/i }))
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Roberto' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('new@b.com', 'password123', 'Roberto'))
    expect(await screen.findByText(/revisá tu email/i)).toBeInTheDocument()
  })

  it('does not show the Nombre field in login mode', () => {
    renderPage()

    expect(screen.queryByLabelText(/nombre/i)).not.toBeInTheDocument()
  })

  // PR12 (live audit fix): this instance actually has `mailer_autoconfirm:
  // true`, so a real signUp call returns an active session immediately —
  // the old unconditional "revisá tu email" message promised a
  // confirmation step that never existed on this instance. The fix branches
  // on the real `session` Supabase already returns, instead of assuming a
  // fixed instance configuration.
  it('navigates straight in when signup already returns an active session (mailer_autoconfirm on)', async () => {
    vi.mocked(signUp).mockResolvedValue({ data: { user: {}, session: {} } as never, error: null })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('tab', { name: /crear cuenta/i }))
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Roberto' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('new@b.com', 'password123', 'Roberto'))
    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(screen.queryByText(/revisá tu email/i)).not.toBeInTheDocument()
  })

  it('shows a readable error message when login fails', async () => {
    vi.mocked(signIn).mockResolvedValue({ data: null, error: 'Invalid login credentials' })

    renderPage()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })
})
