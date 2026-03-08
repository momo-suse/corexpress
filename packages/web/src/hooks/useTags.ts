import { useQuery } from '@tanstack/react-query'
import { getTags } from '@/api/tags'

export function useTags(limit = 6) {
  return useQuery({
    queryKey: ['tags', limit],
    queryFn: () => getTags(limit),
    staleTime: 60_000,
  })
}
