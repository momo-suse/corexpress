/**
 * Nebula layout — dark tech bento-grid style collection.
 * Floating pill nav, bento grid posts, glassmorphism cards,
 * cyan/violet glow accents, 2rem radius.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Terminal,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  Menu,
  X,
  Zap,
  Code2,
  Search,
} from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AboutGallery from '@/components/blog/AboutGallery'
import AboutExperience from '@/components/blog/AboutExperience'
import AboutEducation from '@/components/blog/AboutEducation'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import SearchBar from '@/components/blog/SearchBar'
import TagCloud from '@/components/blog/TagCloud'
import { usePosts } from '@/hooks/usePosts'
import type { Post, TagItem } from '@/types/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
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

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try {
    return JSON.parse(value ?? '[]') as T
  } catch {
    return fallback
  }
}

// ── Social icon map ───────────────────────────────────────────────────────────

const SOCIAL_ICON_MAP: Record<string, typeof Linkedin> = {
  social_linkedin: Linkedin,
  social_instagram: Instagram,
  social_youtube: Youtube,
  social_facebook: Facebook,
}

// ── NebulaFloatingNav ─────────────────────────────────────────────────────────

interface NebulaFloatingNavProps {
  settings: Record<string, string>
  currentPage: 'home' | 'post' | 'about'
  profileVisible: boolean
}

function NebulaFloatingNav({ settings, currentPage, profileVisible }: NebulaFloatingNavProps) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const blogName = settings.blog_name || 'Blog'
  const logoUrl = settings.blog_logo_url

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl">
      <nav className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-2 py-2">
        {/* Logo */}
        <Link to="/" className="pl-4 pr-6 flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={blogName} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <Terminal size={18} className="text-cyan-400" />
          )}
          <span className="font-bold text-white tracking-tight text-sm">{blogName}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center bg-black/40 rounded-full p-1 border border-white/5">
          <Link
            to="/"
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              currentPage === 'home'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('blog.nav.home')}
          </Link>
          {profileVisible && (
            <Link
              to="/about"
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                currentPage === 'about'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('blog.nav.about')}
            </Link>
          )}
        </div>

        {/* Social icons (desktop) */}
        {socialNetworks.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 pr-2">
            {socialNetworks.map(({ key, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 mr-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('blog.nav.closeMenu') : t('blog.nav.openMenu')}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile links dropdown */}
      {mobileOpen && (
        <div className="sm:hidden flex justify-center mt-2 gap-2 flex-wrap">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-white/10 backdrop-blur-md ${
              currentPage === 'home' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            {t('blog.nav.home')}
          </Link>
          {profileVisible && (
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-white/10 backdrop-blur-md ${
                currentPage === 'about' ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {t('blog.nav.about')}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ── NebulaFooter ──────────────────────────────────────────────────────────────

function NebulaFooter({ settings }: { settings: Record<string, string> }) {
  const blogName = settings.blog_name || 'Blog'
  const logoUrl = settings.blog_logo_url

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#030712]/50 backdrop-blur-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={blogName} className="h-4 w-4 rounded-full object-cover" />
          ) : (
            <Terminal size={14} className="text-cyan-400" />
          )}
          <span className="font-bold text-white text-sm">{blogName}</span>
        </div>
        <div className="text-xs font-mono text-slate-500 flex items-center gap-4">
          <span>
            STATUS: <span className="text-cyan-400">ONLINE</span>
          </span>
          <span>//</span>
          <span>© {new Date().getFullYear()} {blogName}</span>
        </div>
      </div>
    </footer>
  )
}

// ── NebulaSidebar ─────────────────────────────────────────────────────────────

interface NebulaSidebarProps {
  settings: Record<string, string>
  profileVisible: boolean
  socialVisible: boolean
  searchVisible: boolean
  tagCloudVisible: boolean
  searchQuery: string
  onSearch: (query: string) => void
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
}

function NebulaSidebar({
  settings,
  profileVisible,
  socialVisible,
  searchVisible,
  tagCloudVisible,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: NebulaSidebarProps) {
  const { t } = useTranslation()
  const name      = settings.profile_name      || ''
  const title     = settings.profile_title     || ''
  const summary   = settings.profile_summary   || ''
  const imageUrl  = settings.profile_image_url || ''

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">

      {/* Profile mini-card — always first */}
      {profileVisible && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-3 relative z-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border border-cyan-400/30 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center shrink-0">
                <Terminal size={18} className="text-cyan-400" />
              </div>
            )}
            <div className="min-w-0">
              {name && <p className="text-white font-semibold text-sm truncate">{name}</p>}
              {title && <p className="text-violet-400 text-xs font-mono truncate">{title}</p>}
            </div>
          </div>

          {summary && (
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 relative z-10">
              {summary}
            </p>
          )}

          {socialVisible && socialNetworks.length > 0 && (
            <div className="flex gap-2 mt-4 relative z-10">
              {socialNetworks.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="p-1.5 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 border border-white/5 transition-colors"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          )}

          <Link
            to="/about"
            className="mt-4 flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors relative z-10"
          >
            {t('blog.about.readMore')} <ArrowUpRight size={12} />
          </Link>
        </div>
      )}

      {/* Search */}
      {searchVisible && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <SearchBar
              variant="default"
              onSearch={onSearch}
              initialQuery={searchQuery}
              styles={{ buttonStyle: 'nebula' }}
            />
          </div>
        </div>
      )}

      {/* Tag cloud */}
      {tagCloudVisible && tags.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">
            {t('blog.tags.title')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => {
              const isActive = tag === activeTag
              return (
                <button
                  key={tag}
                  onClick={() => onTagSelect(isActive ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-violet-300'
                  }`}
                >
                  {tag}
                  {count !== undefined && (
                    <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </aside>
  )
}

// ── NebulaBlogHome ────────────────────────────────────────────────────────────

interface NebulaBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  profileVisible: boolean
  socialVisible: boolean
  postListVisible: boolean
  heroVisible: boolean
  searchVisible: boolean
  tagCloudVisible: boolean
  searchQuery: string
  onSearch: (query: string) => void
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
}

export function NebulaBlogHome({
  settings,
  user,
  profileVisible,
  socialVisible,
  postListVisible,
  heroVisible,
  searchVisible,
  tagCloudVisible,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: NebulaBlogHomeProps) {
  const { t } = useTranslation()
  const { data: postsData } = usePosts(1, false, searchQuery, activeTag)
  const posts = postsData?.data ?? []
  const [featured, ...rest] = posts
  const secondary = rest.slice(0, 3)

  const heroText = settings.hero_text || t('blog.hero.welcome')

  const hasSidebar = profileVisible || searchVisible || tagCloudVisible

  return (
    <div className="dark blog-collection-nebula min-h-screen bg-[#030712] text-slate-300 relative overflow-hidden flex flex-col">
      {/* Background glow effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {user && <AdminBar />}
      <NebulaFloatingNav settings={settings} currentPage="home" profileVisible={profileVisible} />

      <main className={`relative z-10 pt-32 pb-12 max-w-7xl mx-auto px-4 flex-grow w-full ${user ? 'mt-9' : ''}`}>

        {/* Hero section */}
        {heroVisible && (
          <header className="text-center mt-10 mb-16">
            {settings.blog_description && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                {settings.blog_description}
              </div>
            )}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                {heroText}
              </span>
            </h1>
          </header>
        )}

        {/* Main content area: posts + sidebar */}
        <div className={`flex flex-col ${hasSidebar ? 'lg:flex-row' : ''} gap-6 mt-10`}>

          {/* Post list — left / main column */}
          <div className="flex-1 min-w-0">
            {postListVisible && posts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-5">

                {/* Featured post — large card spanning 4/6 columns */}
                {featured && (
                  <Link
                    to={`/post/${featured.slug}`}
                    className="col-span-1 md:col-span-4 md:row-span-2 rounded-[2rem] relative overflow-hidden group border border-white/10 min-h-[400px] block"
                  >
                    {featured.featured_image_url ? (
                      <img
                        src={featured.featured_image_url}
                        alt={featured.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent" />

                    <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
                      {firstTag(featured.tags) && (
                        <div className="flex gap-3 mb-4">
                          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono text-cyan-300">
                            {firstTag(featured.tags)}
                          </span>
                        </div>
                      )}
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-cyan-400 transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-slate-300 font-light mb-6 line-clamp-2 max-w-xl">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                        <Clock size={14} />
                        <span>{(featured as Post & { reading_time?: string }).reading_time ?? readingTime(featured.content || '')}</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Secondary post cards — 2/6 columns each */}
                {secondary.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug}`}
                    className="col-span-1 md:col-span-2 rounded-[2rem] bg-white/[0.02] border border-white/10 p-3 hover:bg-white/[0.04] hover:border-violet-500/50 transition-all duration-300 flex flex-col group relative overflow-hidden"
                  >
                    {/* Hover glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Post image */}
                    <div className="w-full h-40 md:h-48 rounded-3xl overflow-hidden mb-4 relative border border-white/5 flex-shrink-0">
                      {post.featured_image_url ? (
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                      )}
                    </div>

                    <div className="px-3 pb-2 flex flex-col flex-grow relative z-10">
                      {firstTag(post.tags) && (
                        <span className="text-xs font-mono text-violet-400 mb-3 block">
                          {firstTag(post.tags)}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-slate-400 font-light mb-6 flex-grow line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-auto border-t border-white/10 pt-4">
                        <span className="text-xs font-mono text-slate-500">{formatShortDate(post.created_at)}</span>
                        <ArrowUpRight size={16} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}

              </div>
            )}

            {postListVisible && posts.length === 0 && (
              <p className="text-center text-slate-500 py-24 font-mono">{t('blog.posts.noResults')}</p>
            )}
          </div>

          {/* Divider */}
          {hasSidebar && (
            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent shrink-0" />
          )}

          {/* Sidebar — right column */}
          {hasSidebar && (
            <NebulaSidebar
              settings={settings}
              profileVisible={profileVisible}
              socialVisible={socialVisible}
              searchVisible={searchVisible}
              tagCloudVisible={tagCloudVisible}
              searchQuery={searchQuery}
              onSearch={onSearch}
              tags={tags}
              activeTag={activeTag}
              onTagSelect={onTagSelect}
            />
          )}

        </div>
      </main>

      <NebulaFooter settings={settings} />
    </div>
  )
}

// ── NebulaPostContent ─────────────────────────────────────────────────────────

interface NebulaPostContentProps {
  post: Post
  relatedPosts: Post[]
  settings: Record<string, string>
  user: boolean
  commentsEnabled: boolean
  profileVisible: boolean
  socialVisible: boolean
  onCommentSubmitted: () => void
}

export function NebulaPostContent({
  post,
  relatedPosts,
  settings,
  user,
  commentsEnabled,
  profileVisible,
  onCommentSubmitted,
}: NebulaPostContentProps) {
  const { t } = useTranslation()
  const related = relatedPosts.slice(0, 2)

  return (
    <div className="dark blog-collection-nebula min-h-screen bg-[#030712] text-slate-300 relative overflow-hidden flex flex-col">
      {/* Background glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {user && <AdminBar />}
      <NebulaFloatingNav settings={settings} currentPage="post" profileVisible={profileVisible} />

      <main className={`relative z-10 pt-32 pb-12 max-w-7xl mx-auto px-4 flex-grow ${user ? 'mt-9' : ''}`}>
        <article className="max-w-3xl mx-auto mt-10">

          {/* Post header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              {firstTag(post.tags) && (
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
                  {firstTag(post.tags)}
                </span>
              )}
              <span className="text-slate-700">•</span>
              <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                <Clock size={14} className="text-violet-400" />
                {(post as Post & { reading_time?: string }).reading_time ?? readingTime(post.content || '')}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-slate-400 font-light leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Featured image */}
          {post.featured_image_url && (
            <figure className="mb-16 rounded-[2rem] overflow-hidden border border-white/10 relative">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto object-cover max-h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent opacity-40" />
            </figure>
          )}

          {/* Post content */}
          <div
            className="prose prose-invert prose-lg max-w-none prose-p:text-slate-400 prose-p:leading-relaxed prose-p:font-light prose-headings:text-white prose-blockquote:border-l-0 prose-blockquote:rounded-2xl prose-blockquote:bg-white/5 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:relative prose-code:text-cyan-400 [&_a]:![color:var(--blog-accent)]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Related posts + back CTA */}
          <div className="mt-24 pt-12 border-t border-white/10">

            {related.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Sparkles className="text-cyan-400" size={22} />
                  {t('blog.nebula.keepExploring')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {related.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/post/${rp.slug}`}
                      className="group rounded-[2rem] bg-white/[0.02] border border-white/10 p-3 hover:bg-white/[0.04] hover:border-cyan-500/50 transition-all duration-300 flex flex-col relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="w-full h-40 rounded-3xl overflow-hidden mb-4 relative border border-white/5">
                        {rp.featured_image_url ? (
                          <img
                            src={rp.featured_image_url}
                            alt={rp.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                        )}
                      </div>

                      <div className="px-3 pb-2 flex-grow relative z-10">
                        {firstTag(rp.tags) && (
                          <span className="text-xs font-mono text-cyan-400 mb-2 block">
                            {firstTag(rp.tags)}
                          </span>
                        )}
                        <h4 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors leading-snug">
                          {rp.title}
                        </h4>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                          <Clock size={12} className="text-slate-600" />
                          {formatShortDate(rp.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to home CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
              <div className="text-center sm:text-left">
                <h4 className="text-white font-bold text-xl mb-2">{t('blog.nebula.finishedReading')}</h4>
                <p className="text-slate-400 text-sm font-light">{t('blog.nebula.backToHomeDesc')}</p>
              </div>
              <Link
                to="/"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 border border-white/10 rounded-full overflow-hidden transition-all hover:border-cyan-500/50 hover:shadow-[0_0_2rem_-0.5rem_#22d3ee] shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ArrowLeft className="text-cyan-400 group-hover:-translate-x-1 transition-transform relative z-10" size={18} />
                <span className="font-mono text-sm font-bold text-white tracking-widest relative z-10">
                  {t('blog.nebula.backToHome')}
                </span>
              </Link>
            </div>

          </div>

          {/* Comments */}
          {commentsEnabled && (
            <div className="mt-16 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 md:p-8">
                <CommentList postId={post.id} />
              </div>
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 md:p-8">
                <CommentForm postId={post.id} onSubmitted={onCommentSubmitted} />
              </div>
            </div>
          )}

        </article>
      </main>

      <NebulaFooter settings={settings} />
    </div>
  )
}

// ── NebulaAboutContent ────────────────────────────────────────────────────────

interface NebulaAboutContentProps {
  settings: Record<string, string>
  user: boolean
  galleryVisible: boolean
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  socialVisible: boolean
}

export function NebulaAboutContent({
  settings,
  user,
  galleryVisible,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  socialVisible,
}: NebulaAboutContentProps) {
  const { t } = useTranslation()

  const name           = settings.profile_name        || ''
  const title          = settings.profile_title       || ''
  const imageUrl       = settings.profile_image_url   || ''
  const available      = settings.profile_available === '1'
  const summary        = settings.profile_summary     || ''
  const description    = settings.profile_description || ''

  const gallery        = parseJSON<{ url: string; title: string; description: string }[]>(settings.profile_gallery, [])
  const experience     = parseJSON<{ role: string; company: string; period: string; description: string; tags: string[] }[]>(settings.profile_experience, [])
  const skills         = parseJSON<{ name: string; skills: string[] }[]>(settings.profile_skills, [])
  const education      = parseJSON<{ degree: string; institution: string; period: string }[]>(settings.profile_education, [])
  const certifications = parseJSON<{ name: string; url?: string }[]>(settings.profile_certifications, [])
  const testimonials   = parseJSON<{ name: string; role: string; text: string; avatar?: string; linkedin?: string }[]>(settings.profile_testimonials, [])

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className="dark blog-collection-nebula min-h-screen bg-[#030712] text-slate-300 relative overflow-hidden flex flex-col">
      {/* Background glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {user && <AdminBar />}
      <NebulaFloatingNav settings={settings} currentPage="about" profileVisible={true} />

      <main className={`relative z-10 pt-32 pb-12 max-w-7xl mx-auto px-4 flex-grow ${user ? 'mt-9' : ''}`}>
        <div className="mt-10">

          {/* Page title */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-10 text-center">
            {name || t('blog.about.aboutMe')}
            {title && (
              <>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 text-xl md:text-2xl font-light block mt-2">
                  {title}
                </span>
              </>
            )}
          </h1>

          {/* Bento profile grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Main profile card (2 cols) */}
            <div className="col-span-1 md:col-span-2 rounded-[2rem] bg-white/5 border border-white/10 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/50 p-0.5 mb-6"
                />
              )}

              {name && <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>}
              {title && <p className="text-sm font-mono text-violet-400 mb-4">{title}</p>}

              {available && (
                <span className="inline-flex items-center gap-1.5 mb-5 text-xs font-semibold text-green-400 bg-green-900/20 px-2.5 py-1 rounded-full border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t('blog.about.available')}
                </span>
              )}

              {summary && (
                <p className="text-slate-400 font-light leading-relaxed mb-6 text-base">
                  {summary}
                </p>
              )}

              {description && (
                <div
                  className="prose prose-invert max-w-none text-slate-400 font-light [&_a]:![color:var(--blog-accent)]"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}

              {/* Social links inside profile card */}
              {socialVisible && socialNetworks.length > 0 && (
                <div className="flex gap-3 mt-8 flex-wrap">
                  {socialNetworks.map(({ key, href, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 border border-white/10 transition-colors"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Skills card (1 col) */}
            {skillsVisible && skills.length > 0 && (
              <div className="col-span-1 rounded-[2rem] bg-white/5 border border-white/10 p-8 flex flex-col">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Code2 size={18} className="text-violet-400" />
                  {t('blog.about.skills')}
                </h3>
                <div className="space-y-5">
                  {skills.map((group, i) => (
                    <div key={i}>
                      {group.name && (
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                          {group.name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {group.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Philosophy / tagline card — full width */}
            {summary && (
              <div className="col-span-1 md:col-span-3 rounded-[2rem] bg-gradient-to-r from-cyan-900/20 to-violet-900/20 border border-white/10 p-8 md:p-12 text-center">
                <Zap className="mx-auto text-cyan-400 mb-4" size={28} />
                <p className="text-slate-300 max-w-2xl mx-auto font-light text-lg leading-relaxed">
                  {summary}
                </p>
              </div>
            )}

          </div>

          {/* About sub-components — rendered with nebula-native dark cards */}
          {galleryVisible && gallery.length > 0 && (
            <div className="mt-12 rounded-[2rem] bg-white/[0.03] border border-white/10 p-8">
              <AboutGallery data={gallery} />
            </div>
          )}
          {experienceVisible && experience.length > 0 && (
            <div className="mt-8 rounded-[2rem] bg-white/[0.03] border border-white/10 p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500 inline-block" />
                {t('blog.about.experience')}
              </h3>
              <div className="space-y-6">
                {experience.map((exp, i) => (
                  <div key={i} className="border-l border-white/10 pl-5 relative">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-400/50" />
                    <p className="text-white font-semibold">{exp.role}</p>
                    <p className="text-violet-400 text-sm font-mono mt-0.5">{exp.company}</p>
                    {exp.period && <p className="text-slate-600 text-xs font-mono mt-0.5">{exp.period}</p>}
                    {exp.description && <p className="text-slate-400 text-sm mt-2 leading-relaxed">{exp.description}</p>}
                    {exp.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {exp.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-xs font-mono text-slate-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {educationVisible && (education.length > 0 || certifications.length > 0) && (
            <div className="mt-8 rounded-[2rem] bg-white/[0.03] border border-white/10 p-8">
              <AboutEducation education={education} certifications={certifications} />
            </div>
          )}
          {testimonialsVisible && testimonials.length > 0 && (
            <div className="mt-8 rounded-[2rem] bg-white/[0.03] border border-white/10 p-8">
              <AboutTestimonials data={testimonials} />
            </div>
          )}

        </div>
      </main>

      <NebulaFooter settings={settings} />
    </div>
  )
}
