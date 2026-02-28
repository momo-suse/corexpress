import { api } from './client'
import type { ApiResponse, StyleCollection } from '@/types/api'

export function getStyleCollections() {
  return api.get<{ data: StyleCollection[] }>('/style-collections')
}

export function getStyleCollection(id: number) {
  return api.get<ApiResponse<StyleCollection>>(`/style-collections/${id}`)
}
