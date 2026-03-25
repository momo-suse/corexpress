import { http, HttpResponse } from 'msw'

const mockPost = {
  id: 1,
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'A test excerpt',
  tags: 'test, demo',
  reading_time: '2 min',
  status: 'published',
  created_at: '2025-01-01T12:00:00Z',
  updated_at: '2025-01-01T12:00:00Z',
  base_locale: 'en',
  available_locales: ['en'],
  translation_locales: [],
  comments_count: 0,
  comments_pending_count: 0,
  featured_image_url: null,
}

export const postHandlers = [
  http.get('/api/v1/posts', () =>
    HttpResponse.json({
      data: [mockPost],
      meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    }),
  ),

  http.get('/api/v1/posts/:slug', ({ params }) =>
    HttpResponse.json({
      data: { ...mockPost, slug: params.slug as string, content: '<p>Post content</p>' },
    }),
  ),

  http.post('/api/v1/posts', () =>
    HttpResponse.json({ data: mockPost }, { status: 201 }),
  ),

  http.put('/api/v1/posts/:id', () =>
    HttpResponse.json({ data: mockPost }),
  ),

  http.delete('/api/v1/posts/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get('/api/v1/tags', () =>
    HttpResponse.json({
      data: [
        { tag: 'test', count: 3 },
        { tag: 'demo', count: 1 },
      ],
    }),
  ),
]
