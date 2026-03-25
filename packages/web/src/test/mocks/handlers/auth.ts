import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({ data: { id: 1, email: 'admin@test.com' } }),
  ),

  http.get('/api/v1/auth/csrf', () =>
    HttpResponse.json({ csrf_token: 'test-csrf-token' }),
  ),

  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({ data: { id: 1, email: 'admin@test.com' } }),
  ),

  http.post('/api/v1/auth/logout', () =>
    new HttpResponse(null, { status: 204 }),
  ),
]
