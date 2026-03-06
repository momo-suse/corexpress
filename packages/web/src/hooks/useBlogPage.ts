import { useQuery } from '@tanstack/react-query'
import { getPage } from '@/api/pages'

export function useBlogPage() {
  return useQuery({
    queryKey: ['pages', 'home'],
    queryFn: () => getPage('home'),
  })
}

export function useAboutPage() {
  return useQuery({
    queryKey: ['pages', 'about'],
    queryFn: () => getPage('about'),
    retry: false,
  })
}
