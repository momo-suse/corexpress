import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/api'

interface AuthState {
  user: User | null
  csrfToken: string | null
  setAuth: (user: User, csrfToken: string) => void
  setCsrfToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      csrfToken: null,
      setAuth: (user, csrfToken) => set({ user, csrfToken }),
      setCsrfToken: (csrfToken) => set({ csrfToken }),
      clearAuth: () => set({ user: null, csrfToken: null }),
    }),
    {
      name: 'cx-auth',
      // Only persist user, not csrfToken (session-bound)
      partialize: (state) => ({ user: state.user }),
    }
  )
)
