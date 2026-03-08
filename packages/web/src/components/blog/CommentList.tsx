import { useComments } from '@/hooks/useComments'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CommentListProps {
  postId: number
}

export default function CommentList({ postId }: CommentListProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useComments({ post_id: postId, status: 'approved' })

  if (isLoading) return <LoadingSpinner className="py-6" />

  const comments = data?.data ?? []

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={18} className="text-indigo-500" />
        <h3 className="text-lg font-bold">
          {t('blog.comments.count', { count: comments.length })}
        </h3>
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          {t('blog.comments.none')}
        </p>
      )}

      <div className="space-y-6">
        {comments.map((comment) => {
          const date = new Date(comment.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
          })
          return (
            <div key={comment.id} className="flex gap-4">
              {/* Avatar with initials */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {comment.author_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {comment.content}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
