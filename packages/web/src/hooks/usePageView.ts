import { useEffect } from 'react'
import { recordView } from '@/api/analytics'

const DELAY_MS = 1500

export function usePageView(slug: string) {
  useEffect(() => {
    const timeout = setTimeout(() => recordView(slug), DELAY_MS)
    return () => clearTimeout(timeout)
  }, [slug])
}
