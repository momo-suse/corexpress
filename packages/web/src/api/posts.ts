import { api } from './client'
import type { ApiResponse, PaginatedResponse, Post, PostTranslation } from '@/types/api'

export function getPosts(page = 1, all = false, search = '', tag = '') {
  const params = new URLSearchParams({ page: String(page) })
  if (all) params.set('all', '1')
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)
  return api.get<PaginatedResponse<Post>>(`/posts?${params}`)
}

export function getPost(slug: string) {
  return api.get<ApiResponse<Post>>(`/posts/${slug}`)
}

export function createPost(data: Partial<Post>) {
  return api.post<ApiResponse<Post>>('/posts', data)
}

export function updatePost(id: number, data: Partial<Post>) {
  return api.put<ApiResponse<Post>>(`/posts/${id}`, data)
}

export function deletePost(id: number) {
  return api.delete<void>(`/posts/${id}`)
}

export function getPostWithLocale(slug: string, locale: string) {
  return api.get<ApiResponse<Post>>(`/posts/${slug}?locale=${encodeURIComponent(locale)}`)
}

export function createTranslation(postId: number, data: Partial<PostTranslation>) {
  return api.post<ApiResponse<PostTranslation>>(`/posts/${postId}/translations`, data)
}

export function updateTranslation(postId: number, locale: string, data: Partial<PostTranslation>) {
  return api.put<ApiResponse<PostTranslation>>(`/posts/${postId}/translations/${encodeURIComponent(locale)}`, data)
}

export function deleteTranslation(postId: number, locale: string) {
  return api.delete<void>(`/posts/${postId}/translations/${encodeURIComponent(locale)}`)
}
