import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPosts, getPost, createPost, updatePost, deletePost } from '@/api/posts'
import type { Post } from '@/types/api'

export function usePosts(page = 1, all = false, search = '', tag = '') {
  const { i18n } = useTranslation()
  const locale = i18n.language?.slice(0, 2) ?? ''
  return useQuery({
    queryKey: ['posts', page, all, search, tag, locale],
    queryFn: () => getPosts(page, all, search, tag, locale),
  })
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ['posts', slug],
    queryFn: () => getPost(slug),
    enabled: !!slug,
  })
}

export function useMutatePost() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (data: Partial<Post>) => createPost(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) => updatePost(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  return { create, update, remove }
}
