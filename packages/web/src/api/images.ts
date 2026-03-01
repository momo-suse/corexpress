import { useAuthStore } from '@/store/auth'
import { ApiError } from './client'
import type { ImageAsset } from '@/types/api'

const BASE_URL = '/api/v1'

/** Fetch a fresh CSRF token and update the store. Returns null on failure. */
async function refreshCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const { csrf_token } = await res.json()
    useAuthStore.getState().setCsrfToken(csrf_token)
    return csrf_token as string
  } catch {
    return null
  }
}

/**
 * Upload an image file.
 * Handles CSRF 403: refreshes token and retries once before giving up.
 * Only redirects to login on true 401 (session gone).
 */
export async function uploadImage(
  file: File,
  postId?: number,
  retried = false,
): Promise<{ data: ImageAsset }> {
  const formData = new FormData()
  formData.append('image', file)
  if (postId !== undefined) {
    formData.append('post_id', String(postId))
  }

  const csrfToken = useAuthStore.getState().csrfToken

  const response = await fetch(`${BASE_URL}/images`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: formData,
  })

  // 403 on first try = stale CSRF token → refresh and retry once
  if (response.status === 403 && !retried) {
    const newToken = await refreshCsrfToken()
    if (newToken) {
      return uploadImage(file, postId, true)
    }
    // Could not refresh — session is truly gone
    useAuthStore.getState().clearAuth()
    window.location.href = '/cx-admin/login'
    throw new ApiError(403, 'Session expired')
  }

  // 401 = session gone
  if (response.status === 401) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/cx-admin/login'
    throw new ApiError(401, 'Unauthorized')
  }

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error ?? 'Upload failed'
    throw new ApiError(response.status, message)
  }

  return data as { data: ImageAsset }
}

export async function getImages(): Promise<{ data: ImageAsset[] }> {
  const csrfToken = useAuthStore.getState().csrfToken
  const response = await fetch(`${BASE_URL}/images`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  })
  const data = await response.json()
  if (!response.ok) {
    const message = data?.error ?? 'Failed to load images'
    throw new ApiError(response.status, message)
  }
  return data as { data: ImageAsset[] }
}
