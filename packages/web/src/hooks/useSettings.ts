import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '@/api/settings'
import type { Settings } from '@/types/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
}

export function useMutateSettings() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Settings>) => updateSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
