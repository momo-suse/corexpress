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

/** Fetch a fresh CSRF token from the server and store it. Returns the token or null on failure. */
export async function refreshCsrfToken(): Promise<string | null> {
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
 * Force re-login. For mutations (non-GET), we THROW instead of doing a full
 * page reload — this lets the calling code catch the error and show a message
 * without destroying React state (and user's form data).
 */
function forceLogin(status: number, isMutation: boolean): never {
  useAuthStore.getState().clearAuth()
  if (isMutation) {
    // During a save operation, throw so the caller can handle gracefully
    throw new ApiError(
      status,
      status === 401
        ? 'Tu sesión ha expirado. Vuelve a iniciar sesión y reintenta.'
        : 'Error de autenticación. Por favor recarga la página.'
    )
  }
  // For regular navigation (GET), redirect is fine
  window.location.href = '/cx-admin/login'
  throw new ApiError(status, 'Unauthorized')
}

/** Check if the current session is still valid. Returns true if authenticated. */
export async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
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
    forceLogin(403, isMutation)
  }

  // 401 = session gone; 403 after retry = unrecoverable → re-login
  // Only force re-login if the user had an active session; unauthenticated visitors
  // on public blog pages must never be redirected to the admin login screen.
  if (response.status === 401 || response.status === 403) {
    if (useAuthStore.getState().user) {
      forceLogin(response.status, isMutation)
    } else {
      throw new ApiError(response.status, 'Unauthorized')
    }
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
