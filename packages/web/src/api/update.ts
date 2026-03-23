import { api } from './client'

export interface UpdateCheckResult {
  current: string
  latest: string | null
  has_update: boolean
  latest_url?: string
  error?: string
}

export interface UpdateApplyResult {
  success: boolean
  previous_version?: string
  new_version?: string
  migrations_applied?: string[]
  error?: string
}

export function checkUpdate() {
  return api.get<UpdateCheckResult>('/admin/update/check')
}

export function applyUpdate() {
  return api.post<UpdateApplyResult>('/admin/update/apply')
}
