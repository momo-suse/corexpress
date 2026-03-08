import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import PostCard, { FeaturedPostCard } from './PostCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { usePosts } from '@/hooks/usePosts'
import { applyComponentStyles } from '@/lib/utils'

interface PostListProps {
  styles: Record<string, string>
  settings?: Record<string, string>
  searchQuery?: string
  activeTag?: string
}

export default function PostList({ styles, searchQuery = '', activeTag = '' }: PostListProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, activeTag])

  const { data, isLoading, isError } = usePosts(page, false, searchQuery, activeTag)

  if (isLoading) return <LoadingSpinner className="py-16" />

  if (isError) {
    return (
      <p className="text-center text-muted-foreground py-16">
        {t('blog.posts.error')}
      </p>
    )
  }

  const posts = data?.data ?? []
  const featured = posts[0] ?? null
  const rest = posts.slice(1)
  const hasMore = (data?.meta.current_page ?? 1) < (data?.meta.last_page ?? 1)
  const isFirstPage = page === 1

  return (
    <div style={applyComponentStyles(styles)}>
      {/* Destacado — only on first page, not during search or tag filter */}
      {isFirstPage && !searchQuery && !activeTag && featured && (
        <section className="mb-14">
          <div className="flex items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap">{t('blog.posts.featured')}</h2>
            <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
          </div>
          <FeaturedPostCard post={featured} />
        </section>
      )}

      {/* Últimos artículos / search results */}
      {(posts.length > 0 || !isFirstPage) && (
        <section>
          <div className="flex items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight whitespace-nowrap">
              {activeTag
                ? t('blog.posts.taggedWith', { tag: activeTag })
                : searchQuery
                ? t('blog.posts.resultsFor', { query: searchQuery })
                : isFirstPage
                ? t('blog.posts.latest')
                : t('blog.posts.articles')}
            </h2>
            <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* During search/tag filter or page > 1, show all posts in grid; on page 1 no filter, skip featured */}
            {(isFirstPage && !searchQuery && !activeTag ? rest : posts).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {(data?.data.length ?? 0) === 0 && (
            <p className="text-center text-muted-foreground py-12">{t('blog.posts.noMore')}</p>
          )}

          {/* Pagination */}
          <div className="mt-12 flex justify-center gap-3">
            {page > 1 && (
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => setPage((p) => p - 1)}
              >
                {t('blog.posts.previous')}
              </Button>
            )}
            {hasMore && (
              <Button
                variant="outline"
                className="rounded-full px-6 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-all"
                onClick={() => setPage((p) => p + 1)}
              >
                {t('blog.posts.loadMore')}
              </Button>
            )}
          </div>
        </section>
      )}

      {posts.length === 0 && isFirstPage && (
        <p className="text-center text-muted-foreground py-16">
          {activeTag
            ? t('blog.posts.noTag', { tag: activeTag })
            : searchQuery
            ? t('blog.posts.noSearch', { query: searchQuery })
            : t('blog.posts.noResults')}
        </p>
      )}
    </div>
  )
}
