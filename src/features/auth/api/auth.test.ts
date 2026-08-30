import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

import { supabase } from '../../../shared/supabase/client'
import { signIn, signOut, signUp, updateDisplayName } from './auth'

describe('signUp', () => {
  it('calls supabase.auth.signUp with email/password and returns data on success', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    } as never)

    const result = await signUp('a@b.com', 'password123')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' })
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
  })

  it('maps a Supabase error to a readable message', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    } as never)

    const result = await signUp('a@b.com', 'password123')

    expect(result.data).toBeNull()
    expect(result.error).toBe('User already registered')
  })

  it('passes a given display name as user_metadata so it is set from signup, not only editable later', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    } as never)

    await signUp('a@b.com', 'password123', 'Roberto')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
      options: { data: { display_name: 'Roberto' } },
    })
  })

  it('omits options.data entirely when no display name is given (keeps the existing call shape)', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    } as never)

    await signUp('a@b.com', 'password123')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' })
  })
})

describe('signIn', () => {
  it('calls supabase.auth.signInWithPassword and returns data on success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
      error: null,
    } as never)

    const result = await signIn('a@b.com', 'password123')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
    })
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
  })

  it('maps invalid credentials to a readable error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never)

    const result = await signIn('a@b.com', 'wrong')

    expect(result.data).toBeNull()
    expect(result.error).toBe('Invalid login credentials')
  })
})

describe('signOut', () => {
  it('calls supabase.auth.signOut and returns no error on success', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    const result = await signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })

  it('maps a sign-out error to a readable message', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: { message: 'Network error' },
    } as never)

    const result = await signOut()

    expect(result.error).toBe('Network error')
  })
})

describe('updateDisplayName', () => {
  it('calls supabase.auth.updateUser with the display_name metadata field and returns the updated user', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { display_name: 'Roberto' } } },
      error: null,
    } as never)

    const result = await updateDisplayName('Roberto')

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Roberto' } })
    expect(result.error).toBeNull()
    expect(result.data?.user_metadata.display_name).toBe('Roberto')
  })

  it('maps a Supabase error to a readable message', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth session missing' },
    } as never)

    const result = await updateDisplayName('Roberto')

    expect(result.data).toBeNull()
    expect(result.error).toBe('Auth session missing')
  })
})
