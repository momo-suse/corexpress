import { api } from './client'
import type { ApiResponse, PaginatedResponse, Comment } from '@/types/api'

export function getComments(params?: { post_id?: number; status?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.post_id) qs.set('post_id', String(params.post_id))
  if (params?.status) qs.set('status', params.status)
  if (params?.page) qs.set('page', String(params.page))
  return api.get<PaginatedResponse<Comment>>(`/comments?${qs.toString()}`)
}

export function createComment(postId: number, data: { author_name: string; author_email: string; content: string }) {
  return api.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, data)
}

export function updateComment(id: number, data: { status: Comment['status'] }) {
  return api.put<ApiResponse<Comment>>(`/comments/${id}`, data)
}

export function deleteComment(id: number) {
  return api.delete<void>(`/comments/${id}`)
}

export function clearSpamComments() {
  return api.delete<void>('/comments/spam')
}
