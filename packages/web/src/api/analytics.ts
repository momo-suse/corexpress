import { api } from './client'
import type { ApiResponse, AnalyticsSummary } from '@/types/api'

export function recordView(slug: string): void {
  // Fire-and-forget via sendBeacon for reliability on page unload
  const url = '/api/v1/analytics/view'
  const data = JSON.stringify({ slug })
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }))
  } else {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: data,
      keepalive: true,
    }).catch(() => undefined)
  }
}

export function getAnalyticsSummary() {
  return api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary')
}
