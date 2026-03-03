import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import type { Post } from '@/types/api'

import { formatTimeAgo } from '@/lib/utils'

interface PostCardProps {
  post: Post
}

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function firstTag(tags: string | null): string | null {
  if (!tags) return null
  const t = tags.split(',')[0]?.trim()
  return t || null
}

/** Regular post card — displayed in the "Últimos Artículos" 2-column grid. */
export default function PostCard({ post }: PostCardProps) {
  const date = formatTimeAgo(post.created_at)
  const time = readingTime(post.content || post.excerpt || '')
  const hasImage = Boolean(post.featured_image_url)
  const tag = firstTag(post.tags)

  return (
    <article className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
      {/* Featured image with tag badge overlay */}
      {hasImage && (
        <div className="relative h-52 overflow-hidden">
          <Link to={`/post/${post.slug}`} className="block w-full h-full" tabIndex={-1}>
            <img
              src={post.featured_image_url ?? undefined}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
          </Link>
          {/* Tag badge — overlaid on image (glass style) */}
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
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-3 self-center">
            {tag}
          </span>
        )}

        <div className={`flex items-center text-xs text-muted-foreground mb-3 font-medium gap-2 ${!hasImage ? 'justify-center' : ''}`}>
          <span>{date}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {time}
          </span>
        </div>

        <Link to={`/post/${post.slug}`} className="block">
          <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
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
            className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline"
          >
            Leer artículo
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** Featured (Destacado) post card — large 2-column card for the most recent post. */
export function FeaturedPostCard({ post }: PostCardProps) {
  const date = formatTimeAgo(post.created_at)
  const time = readingTime(post.content || post.excerpt || '')
  const hasImage = Boolean(post.featured_image_url)
  const tag = firstTag(post.tags)

  return (
    <Link to={`/post/${post.slug}`} className="block">
      <article className="group grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
        {/* Image half */}
        {hasImage && (
          <div className="relative overflow-hidden h-64 lg:h-full min-h-[300px]">
            <img
              src={post.featured_image_url ?? undefined}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />
          </div>
        )}

        {/* Content half */}
        <div className={`p-8 lg:p-10 flex flex-col justify-center ${!hasImage ? 'lg:col-span-2' : ''}`}>
          {/* Tag badge — indigo/brand style for featured */}
          {tag && (
            <div className="mb-4">
              <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full">
                {tag}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            <span>{date}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {time}
            </span>
          </div>

          <h3 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-muted-foreground text-base mb-8 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
            <span className="inline-flex items-center font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-2 transition-transform duration-300">
              Leer más
              <ArrowRight size={18} className="ml-2" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
