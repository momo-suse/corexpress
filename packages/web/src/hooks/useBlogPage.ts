import { useQuery } from '@tanstack/react-query'
import { getPage } from '@/api/pages'

export function useBlogPage() {
  return useQuery({
    queryKey: ['pages', 'home'],
    queryFn: () => getPage('home'),
  })
}
