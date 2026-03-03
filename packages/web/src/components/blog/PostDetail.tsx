import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowLeft, Share2, Check, MapPin } from 'lucide-react'
import type { Post } from '@/types/api'

import { formatTimeAgo } from '@/lib/utils'

interface PostDetailProps {
  post: Post
  settings?: Record<string, string>
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

export default function PostDetail({ post, settings = {} }: PostDetailProps) {
  const [copied, setCopied] = useState(false)

  const date = formatTimeAgo(post.created_at)
  const time = readingTime(post.content || '')
  const tag = firstTag(post.tags)

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
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors group"
          >
            <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>

          {/* Share button — copies current URL */}
          <button
            onClick={handleShare}
            title="Copiar enlace del artículo"
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200
              ${copied
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? '¡Copiado!' : 'Compartir'}
          </button>
        </div>

        {/* Meta row: category + readtime + date */}
        <div className="flex items-center flex-wrap gap-3 mb-5">
          {tag && (
            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full">
              {tag}
            </span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center font-medium">
            <Clock size={14} className="mr-1.5" /> {time}
          </span>
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
            className="w-full h-auto rounded-2xl shadow-md object-cover max-h-[480px]"
          />
        </figure>
      )}

      {/* Body */}
      <div
        className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-900/20 prose-blockquote:rounded-r-lg prose-blockquote:py-2 mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Optional map embed */}
      {post.map_embed_url && (
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Location
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
