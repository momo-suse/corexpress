import { useAuthStore } from '@/store/auth'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE_URL = '/api/v1'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const isMutation = method !== 'GET'
  if (isMutation) {
    headers['Content-Type'] = 'application/json'
    const csrfToken = useAuthStore.getState().csrfToken
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 401 = session gone, 403 = CSRF token stale/expired → both mean re-login required
  if (response.status === 401 || response.status === 403) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/cx-admin/login'
    throw new ApiError(response.status, response.status === 403 ? 'Session expired' : 'Unauthorized')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? 'Request failed'
    throw new ApiError(response.status, message)
  }

  return data as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
}
