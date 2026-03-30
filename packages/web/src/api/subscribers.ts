import { api } from './client'
import type { ApiResponse, PaginatedResponse, Subscriber } from '@/types/api'

export function getSubscriberMe() {
  return api.get<ApiResponse<Subscriber>>('/auth/subscriber/me')
}

export function logoutSubscriber() {
  return api.post<void>('/auth/subscriber/logout', {})
}

export function getSubscribers(params?: { page?: number; subscribed?: boolean }) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.subscribed !== undefined) qs.set('subscribed', params.subscribed ? '1' : '0')
  return api.get<PaginatedResponse<Subscriber> & { meta: { active: number } }>(`/subscribers?${qs.toString()}`)
}

export function deleteSubscriber(id: number) {
  return api.delete<void>(`/subscribers/${id}`)
}

export function updateSubscriberMe(data: { subscribed: boolean }) {
  return api.patch<ApiResponse<{ id: number; subscribed: boolean }>>('/auth/subscriber/me', data)
}

export function deleteSubscriberMe() {
  return api.delete<void>('/auth/subscriber/me')
}

export function getGoogleOAuthUrl(returnTo?: string): string {
  const qs = returnTo ? '?return_to=' + encodeURIComponent(returnTo) : ''
  return '/api/v1/auth/subscriber/google' + qs
}
