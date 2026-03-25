import { http, HttpResponse } from 'msw'

export const commentHandlers = [
  http.get('/api/v1/posts/:postId/comments', () =>
    HttpResponse.json({
      data: [],
      meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
    }),
  ),

  http.post('/api/v1/posts/:postId/comments', () =>
    HttpResponse.json(
      { data: { id: 1, author_name: 'Test', status: 'pending' } },
      { status: 201 },
    ),
  ),

  http.get('/api/v1/comments', () =>
    HttpResponse.json({
      data: [],
      meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
    }),
  ),

  http.put('/api/v1/comments/:id', () =>
    HttpResponse.json({ data: { id: 1, status: 'approved' } }),
  ),

  http.delete('/api/v1/comments/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),
]
