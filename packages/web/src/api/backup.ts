import { useAuthStore } from '@/store/auth'
import { ApiError, refreshCsrfToken } from './client'

const BASE_URL = '/api/v1'

export type BackupBlock = 'appearance' | 'content' | 'subscribers' | 'activity' | 'media'

export interface BackupInspectResult {
  format: string
  exported_at: string
  app_version: string | null
  available_blocks: BackupBlock[]
  block_counts: Partial<Record<BackupBlock, number>>
  record_counts: Record<string, number>
  has_media_files: boolean
  warnings: string[]
}

export interface BackupRestoreResult {
  success: boolean
  restored_blocks: BackupBlock[]
  warnings: string[]
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data?.error ?? fallback
  } catch {
    return fallback
  }
}

async function authorizedFetch(
  endpoint: string,
  init: RequestInit,
  retried = false,
): Promise<Response> {
  const csrfToken = useAuthStore.getState().csrfToken
  const headers = new Headers(init.headers ?? {})
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 403 && !retried) {
    const refreshed = await refreshCsrfToken()
    if (refreshed) {
      return authorizedFetch(endpoint, init, true)
    }
  }

  if (response.status === 401 || response.status === 403) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/cx-admin/login'
    throw new ApiError(response.status, 'Unauthorized')
  }

  return response
}

export async function downloadBackupArchive(blocks: BackupBlock[], includeMediaFiles: boolean): Promise<void> {
  const response = await authorizedFetch('/admin/backup/export', {
    method: 'POST',
    headers: {
      Accept: 'application/zip',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks,
      include_media_files: includeMediaFiles,
    }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response, 'Backup export failed'))
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? 'corexpress-backup.zip'
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function inspectBackupArchive(file: File): Promise<BackupInspectResult> {
  const formData = new FormData()
  formData.append('archive', file)

  const response = await authorizedFetch('/admin/backup/inspect', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Backup inspection failed')
  }

  return data as BackupInspectResult
}

export async function restoreBackupArchive(file: File, blocks: BackupBlock[]): Promise<BackupRestoreResult> {
  const formData = new FormData()
  formData.append('archive', file)
  formData.append('blocks', JSON.stringify(blocks))

  const response = await authorizedFetch('/admin/backup/restore', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Backup restore failed')
  }

  return data as BackupRestoreResult
}
