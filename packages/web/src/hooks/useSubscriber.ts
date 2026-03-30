import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSubscriberMe, logoutSubscriber, updateSubscriberMe, deleteSubscriberMe } from '@/api/subscribers'
import type { Subscriber } from '@/types/api'

export function useSubscriber() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriber-me'],
    queryFn: async () => {
      try {
        const res = await getSubscriberMe()
        return res.data as Subscriber
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    subscriber: data ?? null,
    isLoading,
    isSubscribed: data?.subscribed ?? false,
  }
}

export function useSubscriberLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logoutSubscriber(),
    onSuccess: () => {
      queryClient.setQueryData(['subscriber-me'], null)
    },
  })
}

export function useUpdateSubscriber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { subscribed: boolean }) => updateSubscriberMe(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['subscriber-me'] })
      const previous = queryClient.getQueryData<Subscriber | null>(['subscriber-me'])
      queryClient.setQueryData(['subscriber-me'], (old: Subscriber | null) =>
        old ? { ...old, subscribed: data.subscribed } : null
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(['subscriber-me'], context?.previous)
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['subscriber-me'], (old: Subscriber | null) =>
        old ? { ...old, subscribed: result.data.subscribed } : null
      )
    },
  })
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteSubscriberMe(),
    onSuccess: () => {
      queryClient.setQueryData(['subscriber-me'], null)
    },
  })
}
