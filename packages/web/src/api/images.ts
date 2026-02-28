import { useAuthStore } from '@/store/auth'
import { ApiError } from './client'
import type { ImageAsset } from '@/types/api'

const BASE_URL = '/api/v1'

function checkAuthError(status: number): void {
  if (status === 401 || status === 403) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/cx-admin/login'
  }
}

/** Upload an image file. Returns the stored image record with its public URL. */
export async function uploadImage(file: File, postId?: number): Promise<{ data: ImageAsset }> {
  const formData = new FormData()
  formData.append('image', file)
  if (postId !== undefined) {
    formData.append('post_id', String(postId))
  }

  // Do NOT set Content-Type — the browser sets multipart/form-data with the correct boundary.
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

  const data = await response.json()
  if (!response.ok) {
    checkAuthError(response.status)
    throw new ApiError(response.status, data?.error ?? 'Upload failed')
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
    checkAuthError(response.status)
    throw new ApiError(response.status, data?.error ?? 'Failed to load images')
  }
  return data as { data: ImageAsset[] }
}
