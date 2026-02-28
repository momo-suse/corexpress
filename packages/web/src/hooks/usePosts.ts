import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPosts, getPost, createPost, updatePost, deletePost } from '@/api/posts'
import type { Post } from '@/types/api'

export function usePosts(page = 1) {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts(page),
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
