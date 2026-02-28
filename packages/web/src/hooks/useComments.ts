import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getComments, updateComment, deleteComment } from '@/api/comments'
import type { Comment } from '@/types/api'

export function useComments(params?: { post_id?: number; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['comments', params],
    queryFn: () => getComments(params),
  })
}

export function useMutateComment() {
  const qc = useQueryClient()

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Comment['status'] }) =>
      updateComment(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  })

  return { update, remove }
}
