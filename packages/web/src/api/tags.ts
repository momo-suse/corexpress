import { api } from './client'
import type { TagItem } from '@/types/api'

export function getTags(limit = 6) {
  return api.get<{ data: TagItem[] }>(`/tags?limit=${limit}`)
}
