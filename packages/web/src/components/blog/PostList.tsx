import { useState } from 'react'
import { Button } from '@/components/ui/button'
import PostCard from './PostCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { usePosts } from '@/hooks/usePosts'
import { applyComponentStyles } from '@/lib/utils'

interface PostListProps {
  styles: Record<string, string>
}

export default function PostList({ styles }: PostListProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = usePosts(page)

  return (
    <section
      className="py-12 px-6 max-w-3xl mx-auto"
      style={applyComponentStyles(styles)}
    >
      <h2 className="text-2xl font-bold mb-8">Posts</h2>

      {isLoading && <LoadingSpinner className="py-12" />}

      {isError && (
        <p className="text-center text-muted-foreground py-12">Failed to load posts.</p>
      )}

      {data && (
        <>
          <div className="space-y-4">
            {data.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {data.data.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No posts yet.</p>
          )}

          {data.meta.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page} / {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
