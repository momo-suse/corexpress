import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import type { Post } from '@/types/api'
import { useTranslation } from 'react-i18next'
import { formatTimeAgo } from '@/lib/utils'

interface PostCardProps {
  post: Post
}

function firstTag(tags: string | null): string | null {
  if (!tags) return null
  const t = tags.split(',')[0]?.trim()
  return t || null
}

/** Regular post card — displayed in the "Últimos Artículos" 2-column grid. */
export default function PostCard({ post }: PostCardProps) {
  const { t } = useTranslation()
  const hasImage = Boolean(post.featured_image_url)
  const tag = firstTag(post.tags)

  return (
    <article
      className="group flex flex-col bg-white dark:bg-gray-900 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
      style={{ borderRadius: 'var(--blog-radius-card)' }}
    >
      {/* Featured image */}
      {hasImage && (
        <div className="relative h-52 overflow-hidden">
          <Link to={`/post/${post.slug}`} className="block w-full h-full" tabIndex={-1}>
            <img
              src={post.featured_image_url ?? undefined}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
              style={{ filter: 'var(--blog-img-filter)' }}
            />
          </Link>
          {tag && (
            <div className="absolute top-3 left-3">
              <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm text-gray-800 dark:text-gray-100">
                {tag}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`p-6 flex flex-col flex-grow ${!hasImage ? 'justify-center items-center text-center' : ''}`}>
        {/* Tag badge for no-image cards */}
        {!hasImage && tag && (
          <span
            className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-3 self-center"
            style={{ background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }}
          >
            {tag}
          </span>
        )}

        <div className={`flex items-center text-xs text-muted-foreground mb-3 font-medium gap-2 ${!hasImage ? 'justify-center' : ''}`}>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatTimeAgo(post.created_at, t)}
          </span>
        </div>

        <Link to={`/post/${post.slug}`} className="block">
          <h3
            className="text-xl font-bold mb-3 transition-colors line-clamp-2 leading-snug"
            style={{ ['--tw-text-opacity' as string]: '1' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '')}
          >
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-muted-foreground mb-6 flex-grow line-clamp-3 text-sm leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className={`mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 ${!hasImage ? 'w-full' : ''}`}>
          <Link
            to={`/post/${post.slug}`}
            className="inline-flex items-center text-sm font-semibold group-hover:underline"
            style={{ color: 'var(--blog-accent)' }}
          >
            {t('blog.posts.readArticle')}
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** Featured (Destacado) post card — large 2-column card for the most recent post. */
export function FeaturedPostCard({ post }: PostCardProps) {
  const { t } = useTranslation()
  const hasImage = Boolean(post.featured_image_url)
  const tag = firstTag(post.tags)

  return (
    <Link to={`/post/${post.slug}`} className="block">
      <article
        className="group grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch bg-white dark:bg-gray-900 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
        style={{ borderRadius: 'var(--blog-radius-card)' }}
      >
        {/* Image half */}
        {hasImage && (
          <div className="relative overflow-hidden h-64 lg:h-full min-h-[300px]">
            <img
              src={post.featured_image_url ?? undefined}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
              style={{ filter: 'var(--blog-img-filter)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />
          </div>
        )}

        {/* Content half */}
        <div className={`p-8 lg:p-10 flex flex-col justify-center ${!hasImage ? 'lg:col-span-2' : ''}`}>
          {/* Tag badge */}
          {tag && (
            <div className="mb-4">
              <span
                className="text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full"
                style={{ background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }}
              >
                {tag}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatTimeAgo(post.created_at, t)}
            </span>
          </div>

          <h3
            className="text-2xl lg:text-3xl font-bold mb-4 leading-tight transition-colors group-hover:[color:var(--blog-accent)]"
          >
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-muted-foreground text-base mb-8 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
            <span
              className="inline-flex items-center font-semibold group-hover:translate-x-2 transition-transform duration-300"
              style={{ color: 'var(--blog-accent)' }}
            >
              {t('blog.posts.readMore')}
              <ArrowRight size={18} className="ml-2" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
