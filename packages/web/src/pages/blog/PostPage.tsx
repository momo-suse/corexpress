import { useParams, Link } from 'react-router-dom'
import { usePost } from '@/hooks/usePosts'
import PostDetail from '@/components/blog/PostDetail'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AdminBar from '@/components/blog/AdminBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const { data, isLoading, isError } = usePost(slug ?? '')

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found.</p>
        <Button variant="outline" asChild>
          <Link to="/">Back to blog</Link>
        </Button>
      </div>
    )
  }

  const post = data.data
  const emptyStyles: Record<string, string> = {}

  function handleCommentSubmitted() {
    qc.invalidateQueries({ queryKey: ['comments'] })
  }

  return (
    <>
      <AdminBar />
      <main>
        <PostDetail post={post} styles={emptyStyles} />
        <CommentList postId={post.id} styles={emptyStyles} />
        <CommentForm
          postId={post.id}
          styles={emptyStyles}
          onSubmitted={handleCommentSubmitted}
        />
      </main>
    </>
  )
}
