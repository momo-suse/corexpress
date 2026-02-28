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

/** Fetch a fresh CSRF token from the server and store it. Returns null on failure. */
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

function forceLogin(status: number): never {
  useAuthStore.getState().clearAuth()
  window.location.href = '/cx-admin/login'
  throw new ApiError(status, status === 403 ? 'Session expired' : 'Unauthorized')
}

async function request<T>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  retried = false
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

  // 403 = CSRF token stale (e.g. after page refresh). Refresh token and retry once.
  if (response.status === 403 && isMutation && !retried) {
    const newToken = await refreshCsrfToken()
    if (newToken) {
      return request<T>(endpoint, method, body, true)
    }
    forceLogin(403)
  }

  // 401 = session gone; 403 after retry = unrecoverable → re-login
  if (response.status === 401 || response.status === 403) {
    forceLogin(response.status)
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
