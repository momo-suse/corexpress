/**
 * ClassicLayout.tsx
 * Editorial blog layout for the "classic" style collection.
 * Based on the blog2.html reference design: fixed left sidebar, serif typography,
 * grayscale images, rose accent, table-style post index.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Clock,
  Share2,
  Check,
} from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import { usePosts } from '@/hooks/usePosts'
import type { Post } from '@/types/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function firstTag(tags: string | null | undefined): string | null {
  if (!tags) return null
  const t = tags.split(',')[0]?.trim()
  return t || null
}

// ── Social icon map ───────────────────────────────────────────────────────────

const SOCIAL_ICON_MAP: Record<string, typeof Linkedin> = {
  social_linkedin: Linkedin,
  social_instagram: Instagram,
  social_youtube: Youtube,
  social_facebook: Facebook,
}

// ── ClassicSidebar ────────────────────────────────────────────────────────────

interface ClassicSidebarProps {
  settings: Record<string, string>
  isHome: boolean
  profileVisible: boolean
  socialVisible: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

function ClassicSidebar({
  settings,
  isHome,
  profileVisible,
  socialVisible,
  mobileOpen,
  onMobileClose,
}: ClassicSidebarProps) {
  const blogName = settings.blog_name || 'Blog'
  const blogLogo = settings.blog_logo_url

  const socialLinks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ href: settings[key], Icon, key }))

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand — editorial masthead, centered */}
      <div className="pt-14 pb-9 px-6 border-b border-gray-200 dark:border-gray-800 text-center shrink-0">
        <Link
          to="/"
          className="group inline-block"
          onClick={onMobileClose}
        >
          {blogLogo && (
            <img
              src={blogLogo}
              alt={blogName}
              className="w-14 h-14 object-cover grayscale mx-auto mb-3"
            />
          )}
          <div className="font-serif font-black text-xl tracking-tight text-gray-900 dark:text-white transition-colors group-hover:[color:var(--blog-accent)]">
            {blogName}
          </div>
        </Link>
      </div>

      <div className="p-10 flex flex-col flex-1">
      {/* Navigation */}
      <nav className="flex flex-col gap-6 mb-16">
        <Link
          to="/"
          onClick={onMobileClose}
          className="text-left font-sans font-medium text-sm tracking-widest uppercase transition-colors flex items-center gap-4"
          style={{ color: isHome ? 'var(--blog-accent)' : undefined }}
          onMouseEnter={(e) => {
            if (!isHome) (e.currentTarget as HTMLElement).style.color = '#111827'
          }}
          onMouseLeave={(e) => {
            if (!isHome) (e.currentTarget as HTMLElement).style.color = ''
          }}
        >
          <span
            className="w-8 h-[1px] shrink-0 bg-current transition-colors"
            style={{ background: isHome ? 'var(--blog-accent)' : 'transparent' }}
          />
          <span className={isHome ? '' : 'text-gray-500 dark:text-gray-400'}>
            Inicio
          </span>
        </Link>
      </nav>

      {/* Profile mini card */}
      {profileVisible && (
        <div className="mb-auto">
          {settings.profile_image_url && (
            <img
              src={settings.profile_image_url}
              alt={settings.profile_name || ''}
              className="w-16 h-16 object-cover mb-4 grayscale"
            />
          )}
          {settings.profile_name && (
            <h4 className="font-serif font-bold text-lg text-gray-900 dark:text-white mb-1">
              {settings.profile_name}
            </h4>
          )}
          {settings.profile_summary && (
            <p className="font-sans text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {settings.profile_summary}
            </p>
          )}
        </div>
      )}

      {/* Social + copyright */}
      <div className={`${profileVisible ? 'mt-12' : 'mt-auto'} pt-8 border-t border-gray-100 dark:border-gray-800/50`}>
        {socialVisible && socialLinks.length > 0 && (
          <div className="flex gap-4 mb-6">
            {socialLinks.map(({ href, Icon, key }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {blogName}.
        </p>
      </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — fixed left */}
      <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] z-40 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:hidden overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={onMobileClose}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>
        {sidebarContent}
      </div>
    </>
  )
}

// ── ClassicMobileHeader ───────────────────────────────────────────────────────

interface ClassicMobileHeaderProps {
  settings: Record<string, string>
  onMenuToggle: () => void
}

function ClassicMobileHeader({ settings, onMenuToggle }: ClassicMobileHeaderProps) {
  const blogName = settings.blog_name || 'Blog'
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex justify-between items-center px-6 py-4">
        <Link
          to="/"
          className="font-serif font-black text-2xl text-gray-900 dark:text-white"
        >
          {blogName}
        </Link>
        <button
          onClick={onMenuToggle}
          className="text-gray-900 dark:text-white"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  )
}

// ── ClassicBlogHome ───────────────────────────────────────────────────────────

export interface ClassicBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  profileVisible: boolean
  socialVisible: boolean
  postListVisible: boolean
  heroVisible: boolean
}

export function ClassicBlogHome({
  settings,
  user,
  profileVisible,
  socialVisible,
  postListVisible,
  heroVisible,
}: ClassicBlogHomeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fetch posts internally — React Query caches across components
  const { data: postsData } = usePosts(1)
  const posts: Post[] = postsData?.data ?? []
  const featuredPost = posts[0] ?? null
  const listPosts = posts.slice(1)

  return (
    <div className="blog-collection-classic min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {user && <AdminBar />}

      <ClassicMobileHeader
        settings={settings}
        onMenuToggle={() => setMobileOpen(true)}
      />
      <ClassicSidebar
        settings={settings}
        isHome={true}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="lg:ml-72 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 lg:py-24">

          {/* Typographic hero */}
          {heroVisible && (
            <section className="mb-20">
              <p
                className="font-sans font-medium tracking-widest uppercase text-sm mb-6"
                style={{ color: 'var(--blog-accent)' }}
              >
                {settings.blog_name || 'El Blog'}
              </p>
              <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-8">
                {settings.hero_text || settings.blog_name || 'Ideas y reflexiones'}
                {settings.blog_description && (
                  <>
                    <br className="hidden md:block" />
                    <span className="text-gray-400 dark:text-gray-600 italic font-light">
                      {settings.blog_description}
                    </span>
                  </>
                )}
              </h1>
            </section>
          )}

          {/* Post list */}
          {postListVisible && (
            <>
              {/* Featured post */}
              {featuredPost && (
                <section className="mb-24">
                  <Link to={`/post/${featuredPost.slug}`} className="group block">
                    {featuredPost.featured_image_url && (
                      <div className="w-full h-[400px] md:h-[480px] overflow-hidden mb-8 relative">
                        <img
                          src={featuredPost.featured_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 bg-white dark:bg-black text-gray-900 dark:text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-2">
                          Destacado
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-4 text-xs font-sans text-gray-500 mb-4 uppercase tracking-widest">
                          {firstTag(featuredPost.tags) && (
                            <span>{firstTag(featuredPost.tags)}</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {readingTime(featuredPost.content || '')}
                          </span>
                        </div>
                        <h2
                          className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4 transition-colors group-hover:[color:var(--blog-accent)]"
                        >
                          {featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="font-sans text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 dark:border-gray-700 transition-all group-hover:border-[var(--blog-accent)] group-hover:bg-[var(--blog-accent)] group-hover:text-white shrink-0">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Post index list */}
              {listPosts.length > 0 && (
                <section>
                  <h3 className="font-sans font-bold text-sm tracking-widest uppercase text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-4 mb-4">
                    Publicaciones Recientes
                  </h3>
                  <div className="flex flex-col">
                    {listPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.slug}`}
                        className="group flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-gray-200 dark:border-gray-800"
                      >
                        <div className="md:w-1/4 mb-2 md:mb-0">
                          <span className="font-sans text-sm text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                            {formatShortDate(post.created_at)}
                          </span>
                        </div>
                        <div className="md:w-2/4 pr-4">
                          <h4 className="font-serif text-2xl font-bold text-gray-900 dark:text-white group-hover:[color:var(--blog-accent)] transition-colors leading-snug">
                            {post.title}
                          </h4>
                        </div>
                        <div className="md:w-1/4 flex justify-between items-center mt-4 md:mt-0">
                          {firstTag(post.tags) ? (
                            <span className="font-sans text-sm text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full">
                              {firstTag(post.tags)}
                            </span>
                          ) : (
                            <span />
                          )}
                          <ArrowRight
                            size={20}
                            className="text-gray-300 dark:text-gray-700 group-hover:[color:var(--blog-accent)] group-hover:translate-x-2 transition-all"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {posts.length === 0 && (
                <p className="font-sans text-gray-500 text-center py-16">
                  No hay publicaciones aún.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-serif font-bold text-xl text-gray-900 dark:text-white">
              {settings.blog_name || 'Blog'}.
            </div>
            <p className="font-sans text-sm text-gray-500">
              © {new Date().getFullYear()} {settings.blog_name || 'Blog'}. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

// ── ClassicPostContent ────────────────────────────────────────────────────────

export interface ClassicPostContentProps {
  post: Post
  relatedPosts: Post[]
  settings: Record<string, string>
  user: boolean
  commentsEnabled: boolean
  profileVisible: boolean
  socialVisible: boolean
  onCommentSubmitted: () => void
}

export function ClassicPostContent({
  post,
  relatedPosts,
  settings,
  user,
  commentsEnabled,
  profileVisible,
  socialVisible,
  onCommentSubmitted,
}: ClassicPostContentProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="blog-collection-classic min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {user && <AdminBar />}

      <ClassicMobileHeader
        settings={settings}
        onMenuToggle={() => setMobileOpen(true)}
      />
      <ClassicSidebar
        settings={settings}
        isHome={false}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="lg:ml-72 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 lg:py-24">
          <article>
            {/* Article header */}
            <header className="mb-12 md:mb-16">
              <div className="flex justify-between items-center mb-8">
                <div
                  className="flex items-center flex-wrap gap-3 text-xs font-sans uppercase tracking-widest font-bold"
                  style={{ color: 'var(--blog-accent)' }}
                >
                  {firstTag(post.tags) && <span>{firstTag(post.tags)}</span>}
                  {firstTag(post.tags) && (
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {readingTime(post.content || '')}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span>{formatShortDate(post.created_at)}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title={copied ? '¡Enlace copiado!' : 'Compartir'}
                >
                  {copied ? <Check size={20} /> : <Share2 size={20} />}
                </button>
              </div>

              <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-8">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="font-sans text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Featured image — editorial framed style */}
            {post.featured_image_url && (
              <figure className="mb-16">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto object-cover border border-gray-200 dark:border-gray-800 p-2 bg-white dark:bg-[#111]"
                />
              </figure>
            )}

            {/* Article body */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:font-light [&_a]:![color:var(--blog-accent)] [&_blockquote]:!border-l-[2px] [&_blockquote]:![border-left-color:var(--blog-accent)] mb-20"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* "Sigue Leyendo" related posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
                <h3 className="font-sans font-bold text-sm tracking-widest uppercase text-gray-900 dark:text-white mb-8">
                  Sigue Leyendo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/post/${rp.slug}`}
                      className="group flex flex-col"
                    >
                      {rp.featured_image_url && (
                        <div className="w-full h-48 overflow-hidden mb-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-1">
                          <img
                            src={rp.featured_image_url}
                            alt={rp.title}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white group-hover:[color:var(--blog-accent)] transition-colors leading-snug mb-2">
                        {rp.title}
                      </h4>
                      <span className="font-sans text-xs text-gray-500 uppercase tracking-widest">
                        {formatShortDate(rp.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-800/50">
                  <Link
                    to="/"
                    className="font-sans font-bold text-sm tracking-widest uppercase flex items-center gap-2 text-gray-900 dark:text-white hover:[color:var(--blog-accent)] transition-colors group"
                  >
                    <ArrowLeft
                      size={16}
                      className="group-hover:-translate-x-2 transition-transform"
                    />
                    Volver al inicio
                  </Link>
                </div>
              </div>
            )}
          </article>

          {/* Comments — editorial style (no card wrapper, just border-t) */}
          {commentsEnabled && (
            <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800 space-y-12">
              <CommentList postId={post.id} />
              <CommentForm postId={post.id} onSubmitted={onCommentSubmitted} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
