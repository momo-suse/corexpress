import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowLeft, Share2, Check, MapPin } from 'lucide-react'
import type { Post } from '@/types/api'
import { useTranslation } from 'react-i18next'
import { formatTimeAgo } from '@/lib/utils'

interface PostDetailProps {
  post: Post
  settings?: Record<string, string>
}

export default function PostDetail({ post, settings = {} }: PostDetailProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const date = formatTimeAgo(post.created_at, t)
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  // settings kept in props for future use (e.g. branding)
  void settings

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <article>
      {/* Article header */}
      <header className="mb-8">
        {/* Top row: back link + share button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors group hover:[color:var(--blog-accent)]"
          >
            <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
            {t('blog.post.back')}
          </Link>

          {/* Share button — copies current URL */}
          <button
            onClick={handleShare}
            title={t('blog.post.copyLink')}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200
              ${copied
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            style={!copied ? { ['--hover-accent' as string]: 'var(--blog-accent)' } : undefined}
            onMouseEnter={(e) => { if (!copied) { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' } }}
            onMouseLeave={(e) => { if (!copied) { (e.currentTarget as HTMLElement).style.color = '' } }}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? t('blog.post.copied') : t('blog.post.share')}
          </button>
        </div>

        {/* Meta row: tags + reading time + date */}
        <div className="flex items-center flex-wrap gap-3 mb-5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full"
              style={{ background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }}
            >
              {tag}
            </span>
          ))}
          {post.reading_time && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center font-medium">
              <Clock size={14} className="mr-1.5" /> {post.reading_time}
            </span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">• {date}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-5 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt / lead */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Featured image */}
      {post.featured_image_url && (
        <figure className="mb-10">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-auto shadow-md object-cover max-h-[480px]"
            style={{ borderRadius: 'var(--blog-radius-card)', filter: 'var(--blog-img-filter)' }}
          />
        </figure>
      )}

      {/* Body */}
      <div
        className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-img:shadow-md prose-blockquote:rounded-r-lg prose-blockquote:py-2 mb-12 [&_a]:![color:var(--blog-accent)] [&_blockquote]:![border-left-color:var(--blog-accent)] [&_blockquote]:![background-color:var(--blog-accent-soft)]"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Optional map embed */}
      {post.map_embed_url && (
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t('blog.post.location')}
            </h3>
          </div>
          <iframe
            src={post.map_embed_url}
            title="Post location map"
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
            style={{ height: '400px', minHeight: '260px' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </article>
  )
}
