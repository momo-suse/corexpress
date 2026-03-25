import { http, HttpResponse } from 'msw'

const mockSettings = {
  blog_name: 'Test Blog',
  blog_description: 'A test blog',
  blog_theme: 'default',
  active_style_collection: 'default',
  comments_enabled: '1',
}

export const settingsHandlers = [
  http.get('/api/v1/settings', () =>
    HttpResponse.json({ data: mockSettings }),
  ),

  http.put('/api/v1/settings', () =>
    HttpResponse.json({ data: mockSettings }),
  ),
]
