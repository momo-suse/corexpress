import { api } from './client'
import type { ApiResponse, LikeStatus } from '@/types/api'

export function getLikes(postId: number) {
  return api.get<ApiResponse<LikeStatus>>(`/posts/${postId}/likes`)
}

export function toggleLike(postId: number) {
  return api.post<ApiResponse<LikeStatus>>(`/posts/${postId}/likes`)
}
