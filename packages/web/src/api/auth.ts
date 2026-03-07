import { api } from './client'
import { useAuthStore } from '@/store/auth'
import type { ApiResponse, User } from '@/types/api'

interface CsrfResponse {
  csrf_token: string
}

interface LoginPayload {
  email: string
  password: string
}

interface AuthResponse {
  data: User
  csrf_token: string
}

export async function csrf(): Promise<string> {
  const res = await api.get<CsrfResponse>('/auth/csrf')
  useAuthStore.getState().setCsrfToken(res.csrf_token)
  return res.csrf_token
}

export async function login(payload: LoginPayload): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/login', payload)
  useAuthStore.getState().setAuth(res.data, res.csrf_token)
  return res.data
}

export async function me(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me')
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  useAuthStore.getState().clearAuth()
}

export async function forgotPassword(email: string): Promise<{ email_sent: boolean }> {
  return api.post<{ message: string; email_sent: boolean }>('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string, passwordConfirm: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password, password_confirm: passwordConfirm })
}

export async function changePassword(currentPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
  await api.post('/auth/change-password', {
    current_password:     currentPassword,
    new_password:         newPassword,
    new_password_confirm: newPasswordConfirm,
  })
}
