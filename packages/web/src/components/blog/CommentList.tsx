import { useComments } from '@/hooks/useComments'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { applyComponentStyles } from '@/lib/utils'

interface CommentListProps {
  postId: number
  styles: Record<string, string>
}

export default function CommentList({ postId, styles }: CommentListProps) {
  const { data, isLoading } = useComments({ post_id: postId, status: 'approved' })

  if (isLoading) return <LoadingSpinner className="py-6" />

  const comments = data?.data ?? []

  return (
    <section className="py-8 px-6 max-w-3xl mx-auto" style={applyComponentStyles(styles)}>
      <h3 className="text-lg font-semibold mb-4">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      )}

      <div className="space-y-6">
        {comments.map((comment) => {
          const date = new Date(comment.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
          return (
            <div key={comment.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>
              <p className="text-sm leading-relaxed">{comment.content}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
