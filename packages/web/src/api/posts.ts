import { api } from './client'
import type { ApiResponse, PaginatedResponse, Post } from '@/types/api'

export function getPosts(page = 1) {
  return api.get<PaginatedResponse<Post>>(`/posts?page=${page}`)
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
