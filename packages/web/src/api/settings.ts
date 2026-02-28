import { api } from './client'
import type { Settings } from '@/types/api'

export function getSettings() {
  return api.get<{ data: Settings }>('/settings')
}

export function updateSettings(data: Partial<Settings>) {
  return api.put<{ data: Settings }>('/settings', data)
}
