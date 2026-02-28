import { api } from './client'
import type { ApiResponse, Page } from '@/types/api'

export function getPage(slug: string) {
  return api.get<ApiResponse<Page>>(`/pages/${slug}`)
}

export function updatePageComponent(componentId: number, data: { is_visible?: boolean; display_order?: number }) {
  return api.put<void>(`/pages/components/${componentId}`, data)
}
