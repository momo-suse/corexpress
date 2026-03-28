/**
 * Sonic layout — brutalista musical.
 * Dark zinc-950 background, fuchsia-500 / cyan-400 dual accent,
 * uppercase font-black typography, sharp 0px radius, grayscale images.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Headphones,
  ArrowLeft,
  MoveRight,
  Disc,
  Radio,
  Menu,
  X,
  Search,
} from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import LanguageSwitcher from '@/components/blog/LanguageSwitcher'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AboutGallery from '@/components/blog/AboutGallery'
import AboutExperience from '@/components/blog/AboutExperience'
import AboutSkills from '@/components/blog/AboutSkills'
import AboutEducation from '@/components/blog/AboutEducation'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import AboutPdfButton from '@/components/blog/AboutPdfButton'
import TagCloud from '@/components/blog/TagCloud'
import { usePosts } from '@/hooks/usePosts'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Post, TagItem } from '@/types/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function formatDate(dateStr: string): string {
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
    const result = JSON.parse(value ?? '[]') as T | null
    return result ?? fallback
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

// ── SonicNav ─────────────────────────────────────────────────────────────────

interface SonicNavProps {
  settings: Record<string, string>
  user: boolean
  currentPage: 'home' | 'post' | 'about'
  profileVisible?: boolean
}

function SonicNav({ settings, user, currentPage, profileVisible = true }: SonicNavProps) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const blogName = settings.blog_name || 'Blog'
  const logoUrl  = settings.blog_logo_url

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <nav
      className={`w-full py-5 px-6 md:px-12 flex justify-between items-center bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 sticky z-40 w-full ${user ? 'top-9' : 'top-0'}`}
    >
      {/* Left nav links */}
      <div className="flex gap-6 text-sm tracking-[0.2em] font-bold text-zinc-500">
        <Link
          to="/"
          className={`hover:text-fuchsia-500 transition-colors uppercase ${currentPage === 'home' ? 'text-zinc-100' : ''}`}
        >
          {t('blog.nav.home')}
        </Link>
        {profileVisible && (
          <Link
            to="/about"
            className={`hover:text-cyan-400 transition-colors uppercase ${currentPage === 'about' ? 'text-zinc-100' : ''}`}
          >
            {t('blog.nav.about')}
          </Link>
        )}
      </div>

      {/* Brand — centered */}
      <Link
        to="/"
        className="absolute left-1/2 -translate-x-1/2 font-sans font-black text-2xl text-zinc-100 tracking-tighter hover:text-fuchsia-500 transition-colors flex items-center gap-2"
      >
        {logoUrl ? (
          <img src={logoUrl} alt={blogName} className="h-6 w-6 object-cover" />
        ) : (
          <Headphones size={22} className="text-cyan-400" />
        )}
        {blogName.toUpperCase()}.
      </Link>

      {/* Right: social icons + language switcher + mobile toggle */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-4 text-zinc-500">
          {socialNetworks.map(({ key, href, Icon }, i) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key}
              className={`transition-colors ${i % 2 === 0 ? 'hover:text-cyan-400' : 'hover:text-fuchsia-500'}`}
            >
              <Icon size={18} />
            </a>
          ))}
          <LanguageSwitcher variant="nebula" />
        </div>

        {/* Mobile toggle */}
        <button
          className="sm:hidden p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('blog.nav.closeMenu') : t('blog.nav.openMenu')}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 px-6 py-4 flex flex-col gap-3 sm:hidden z-50">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-fuchsia-500 transition-colors"
          >
            {t('blog.nav.home')}
          </Link>
          {profileVisible && (
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-cyan-400 transition-colors"
            >
              {t('blog.nav.about')}
            </Link>
          )}
          <div className="flex items-center gap-3 pt-1">
            <LanguageSwitcher variant="nebula" />
            {socialNetworks.map(({ key, href, Icon }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-fuchsia-500 transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

// ── SonicFooter ───────────────────────────────────────────────────────────────

function SonicFooter({ settings }: { settings: Record<string, string> }) {
  const blogName = settings.blog_name || 'Blog'

  return (
    <footer className="border-t border-zinc-800 mt-20 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="font-black uppercase text-3xl text-zinc-100 tracking-tighter flex items-center gap-2 opacity-40">
          <Headphones size={22} />
          {blogName.toUpperCase()}.
        </div>
        <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest text-center md:text-right">
          © {new Date().getFullYear()} {blogName}
        </p>
      </div>
    </footer>
  )
}

// ── SonicSearch — inline dark search bar ──────────────────────────────────────

function SonicSearch({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const { t } = useTranslation()
  const [local, setLocal] = useState(value)

  function submit() { onChange(local.trim()) }

  return (
    <div className="flex items-center gap-3 border-b border-zinc-700 pb-2">
      <Search size={14} className="text-zinc-600 shrink-0" />
      <input
        type="search"
        value={local}
        onChange={(e) => { setLocal(e.target.value); if (e.target.value === '') onChange('') }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('blog.search.placeholder')}
        className="flex-1 bg-transparent text-zinc-300 placeholder-zinc-600 outline-none text-xs font-mono tracking-wide"
        aria-label={t('blog.search.ariaLabel')}
      />
      <button
        type="button"
        onClick={submit}
        className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-fuchsia-500 transition-colors shrink-0"
      >
        {t('blog.search.button')}
      </button>
    </div>
  )
}

// ── SonicBlogHome ─────────────────────────────────────────────────────────────

interface SonicBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  heroVisible: boolean
  postListVisible: boolean
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

export function SonicBlogHome({
  settings,
  user,
  heroVisible,
  postListVisible,
  profileVisible,
  socialVisible,
  searchVisible,
  tagCloudVisible,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: SonicBlogHomeProps) {
  const { data: postsData } = usePosts(1)
  const allPosts = postsData?.data ?? []
  const [featured, ...gridPosts] = allPosts

  const heroText     = settings.hero_text     || settings.blog_name || 'Blog'
  const heroImageUrl = settings.hero_image_url

  const profileName    = settings.profile_name    || ''
  const profileTitle   = settings.profile_title   || ''
  const profileSummary = settings.profile_summary || ''
  const profileImage   = settings.profile_image_url || ''

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className="blog-collection-sonic min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-fuchsia-500 selection:text-white">
      {user && <AdminBar />}
      <SonicNav settings={settings} user={user} currentPage="home" profileVisible={profileVisible} />

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32">

        {/* Hero */}
        {heroVisible && (
          <header className="mt-12 mb-16 flex flex-col items-start gap-6 border-l-8 border-fuchsia-500 pl-8">
            {heroImageUrl && (
              <div className="w-full max-h-56 overflow-hidden">
                <img
                  src={heroImageUrl}
                  alt={heroText}
                  className="w-full h-56 object-cover grayscale contrast-125"
                />
              </div>
            )}
            <h1 className="font-sans font-black uppercase text-6xl md:text-8xl text-zinc-100 leading-[0.9] tracking-tighter">
              {heroText.split(' ').map((word, i, arr) =>
                i === arr.length - 1 ? (
                  <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400"> {word}.</span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </h1>
            <p className="font-mono text-zinc-500 tracking-widest uppercase text-xs flex items-center gap-3 bg-zinc-900 py-2 px-4">
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              {settings.blog_description || ''}
            </p>
          </header>
        )}

        {/* Search + Tags — slim dark strip, positioned before the featured post */}
        {(searchVisible || tagCloudVisible) && (
          <div className="mb-12 flex flex-col gap-4">
            {searchVisible && (
              <SonicSearch value={searchQuery} onChange={onSearch} />
            )}
            {tagCloudVisible && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <TagCloud
                  tags={tags}
                  activeTag={activeTag}
                  onTagSelect={onTagSelect}
                  bare={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Featured post */}
        {postListVisible && featured && (
          <div className="mb-20">
            <Link to={`/post/${featured.slug}`} className="block cursor-pointer group relative">
              <div className="absolute inset-0 bg-fuchsia-500 translate-x-4 translate-y-4 -z-10 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
              <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden bg-zinc-900 border border-zinc-800 mb-8">
                {featured.featured_image_url ? (
                  <img
                    src={featured.featured_image_url}
                    alt={featured.title}
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Disc size={48} className="text-fuchsia-500 opacity-30" />
                  </div>
                )}
              </div>
              <div className="max-w-4xl bg-zinc-950 pr-8">
                <div className="flex items-center gap-4 mb-4">
                  {firstTag(featured.tags) && (
                    <span className="bg-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest px-3 py-1">
                      {firstTag(featured.tags)}
                    </span>
                  )}
                  <span className="font-mono text-zinc-500 text-sm">{formatDate(featured.created_at)}</span>
                </div>
                <h2 className="font-black uppercase text-4xl md:text-6xl mb-6 group-hover:text-fuchsia-500 transition-colors duration-300 leading-[0.9] tracking-tighter">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-zinc-400 text-xl font-light leading-relaxed mb-8 max-w-2xl border-l-2 border-zinc-800 pl-4">
                    {featured.excerpt}
                  </p>
                )}
                <span className="text-zinc-100 font-bold uppercase tracking-widest inline-flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                  <MoveRight size={20} strokeWidth={3} />
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Post grid */}
        {postListVisible && gridPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {gridPosts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="group flex flex-col bg-zinc-900 p-6 border border-zinc-800 hover:border-fuchsia-500 transition-colors"
              >
                <div className="w-full aspect-square overflow-hidden mb-6 bg-zinc-950">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc size={32} className="text-zinc-700" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4">
                  {firstTag(post.tags) && (
                    <span className="text-fuchsia-500 text-xs font-black uppercase tracking-widest">
                      {firstTag(post.tags)}
                    </span>
                  )}
                  <span className="font-mono text-zinc-600 text-xs ml-auto">
                    {post.reading_time ?? readingTime(post.content)}
                  </span>
                </div>
                <h3 className="font-black uppercase text-xl mb-4 text-zinc-100 group-hover:text-cyan-400 transition-colors leading-none tracking-tighter">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-zinc-400 text-sm leading-relaxed flex-grow">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Profile bio — always links to /about */}
        {profileVisible && (profileName || profileSummary) && (
          <Link
            to="/about"
            className="block border-t border-zinc-800 pt-12 mt-8 group"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center hover:opacity-90 transition-opacity">
              {profileImage && (
                <div className="w-20 h-20 shrink-0 overflow-hidden border-2 border-zinc-800 group-hover:border-fuchsia-500 transition-colors">
                  <img
                    src={profileImage}
                    alt={profileName}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              )}
              <div className="flex-1">
                {profileName && (
                  <p className="font-black uppercase text-xl text-zinc-100 tracking-tighter mb-1 group-hover:text-fuchsia-500 transition-colors">
                    {profileName} <span className="text-zinc-600 text-sm font-normal ml-2">→</span>
                  </p>
                )}
                {profileTitle && (
                  <p className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-3">{profileTitle}</p>
                )}
                {profileSummary && (
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">{profileSummary}</p>
                )}
                {socialVisible && socialNetworks.length > 0 && (
                  <div className="flex gap-4 mt-4" onClick={(e) => e.preventDefault()}>
                    {socialNetworks.map(({ key, href, Icon }) => (
                      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-fuchsia-500 transition-colors">
                        <Icon size={16} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

      </main>

      <SonicFooter settings={settings} />
    </div>
  )
}

// ── SonicPostContent ──────────────────────────────────────────────────────────

interface SonicPostContentProps {
  post: Post
  relatedPosts: Post[]
  settings: Record<string, string>
  user: boolean
  commentsEnabled: boolean
  profileVisible: boolean
  socialVisible: boolean
  onCommentSubmitted: () => void
  availableLocales?: string[]
  currentLocale?: string
  onLocaleChange?: (locale: string) => void
}

export function SonicPostContent({
  post,
  relatedPosts,
  settings,
  user,
  commentsEnabled,
  profileVisible,
  onCommentSubmitted,
  availableLocales,
  currentLocale,
  onLocaleChange,
}: SonicPostContentProps) {
  const { t } = useTranslation()
  const category = firstTag(post.tags)

  return (
    <div className="blog-collection-sonic min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-fuchsia-500 selection:text-white">
      {user && <AdminBar />}
      <SonicNav settings={settings} user={user} currentPage="post" profileVisible={profileVisible} />

      <main className="max-w-4xl mx-auto px-6 pt-16 pb-32">
        <article>
          {/* Article header */}
          <header className="mb-12 border-b-2 border-zinc-800 pb-10">
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              {category && (
                <span className="bg-fuchsia-500 text-zinc-950 text-sm font-black uppercase tracking-widest px-4 py-1">
                  {category}
                </span>
              )}
              <span className="font-mono text-zinc-400">
                {formatDate(post.created_at)}
                {' // '}
                {post.reading_time ?? readingTime(post.content)}
              </span>
              {/* Locale switcher */}
              {availableLocales && availableLocales.length > 1 && onLocaleChange && (
                <div className="flex gap-1 ml-auto">
                  {availableLocales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => onLocaleChange(loc)}
                      className={`px-3 py-1 text-xs font-black uppercase tracking-wider border transition-colors ${
                        loc === currentLocale
                          ? 'bg-fuchsia-500 border-fuchsia-500 text-zinc-950'
                          : 'border-zinc-700 text-zinc-500 hover:border-fuchsia-500 hover:text-fuchsia-500'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <h1 className="font-black uppercase text-4xl md:text-6xl text-zinc-100 leading-[0.9] tracking-tighter">
              {post.title}
            </h1>
          </header>

          {/* Hero image */}
          {post.featured_image_url && (
            <figure className="mb-12 border-4 border-zinc-800">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto object-cover max-h-[600px] grayscale contrast-125"
              />
            </figure>
          )}

          {/* Post content */}
          <div
            className="prose prose-invert prose-lg md:prose-xl max-w-none
              prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
              prose-h2:text-3xl prose-h2:border-b-4 prose-h2:border-fuchsia-500 prose-h2:pb-2 prose-h2:inline-block
              prose-blockquote:font-mono prose-blockquote:text-cyan-400 prose-blockquote:bg-zinc-900 prose-blockquote:border-l-4 prose-blockquote:border-cyan-400 prose-blockquote:not-italic
              prose-a:text-fuchsia-500 prose-a:no-underline hover:prose-a:underline
              prose-code:text-cyan-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-24">
            <div className="border-t-4 border-zinc-900 pt-12 bg-zinc-900/50 px-8 pb-12">
              <h3 className="font-black uppercase text-2xl text-zinc-100 mb-10 tracking-tighter flex items-center gap-3">
                <Disc size={28} className="text-fuchsia-500" />
                {t('blog.sonic.nextInPlaylist')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.slice(0, 2).map((p) => (
                  <Link
                    key={p.id}
                    to={`/post/${p.slug}`}
                    className="group flex gap-5 items-center bg-zinc-950 p-4 border border-zinc-800 hover:border-cyan-400 transition-colors"
                  >
                    <div className="w-20 h-20 shrink-0 bg-zinc-800 overflow-hidden">
                      {p.featured_image_url ? (
                        <img
                          src={p.featured_image_url}
                          alt={p.title}
                          className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc size={20} className="text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {firstTag(p.tags) && (
                        <span className="text-fuchsia-500 text-[10px] font-black uppercase tracking-widest mb-1 block">
                          {firstTag(p.tags)}
                        </span>
                      )}
                      <h4 className="font-black uppercase text-base text-zinc-100 group-hover:text-cyan-400 transition-colors leading-tight tracking-tight">
                        {p.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-12">
          <Link
            to="/"
            className="w-full py-8 bg-zinc-900 hover:bg-fuchsia-500 text-zinc-400 hover:text-zinc-950 font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-4 group"
          >
            <ArrowLeft size={22} strokeWidth={3} className="group-hover:-translate-x-2 transition-transform" />
            {t('blog.sonic.backToStart')}
          </Link>
        </div>

        {/* Comments */}
        {commentsEnabled && (
          <div className="mt-16 space-y-8">
            <div className="[&_*]:!rounded-none [&_input]:!bg-zinc-900 [&_input]:!border-zinc-700 [&_textarea]:!bg-zinc-900 [&_textarea]:!border-zinc-700 [&_button[type=submit]]:!bg-fuchsia-500 [&_button[type=submit]]:hover:!bg-fuchsia-600 [&_button[type=submit]]:!text-zinc-950 [&_button[type=submit]]:!font-black [&_button[type=submit]]:!uppercase [&_button[type=submit]]:!tracking-wider">
              <CommentList postId={post.id} />
            </div>
            <div className="[&_*]:!rounded-none [&_input]:!bg-zinc-900 [&_input]:!border-zinc-700 [&_textarea]:!bg-zinc-900 [&_textarea]:!border-zinc-700 [&_button[type=submit]]:!bg-fuchsia-500 [&_button[type=submit]]:hover:!bg-fuchsia-600 [&_button[type=submit]]:!text-zinc-950 [&_button[type=submit]]:!font-black [&_button[type=submit]]:!uppercase [&_button[type=submit]]:!tracking-wider">
              <CommentForm postId={post.id} onCommentSubmitted={onCommentSubmitted} recaptchaSiteKey={settings.recaptcha_site_key} />
            </div>
          </div>
        )}

      </main>

      <SonicFooter settings={settings} />
    </div>
  )
}

// ── SonicAboutContent ─────────────────────────────────────────────────────────

interface SonicAboutContentProps {
  settings: Record<string, string>
  user: boolean
  galleryVisible: boolean
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  socialVisible: boolean
  downloadPdfVisible?: boolean
}

export function SonicAboutContent({
  settings,
  user,
  galleryVisible,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  socialVisible,
  downloadPdfVisible,
}: SonicAboutContentProps) {
  const profileName        = settings.profile_name        || ''
  const profileTitle       = settings.profile_title       || ''
  const profileSummary     = settings.profile_summary     || ''
  const profileDescription = settings.profile_description || ''
  const profileImage       = settings.profile_image_url   || ''

  const gallery      = parseJSON<{ url: string; title: string; description: string }[]>(settings.profile_gallery, [])
  const experience   = parseJSON<{ role: string; company: string; period: string; description: string; tags: string[] }[]>(settings.profile_experience, [])
  const skills       = parseJSON<{ name: string; skills: string[] }[]>(settings.profile_skills, [])
  const education    = parseJSON<{ degree: string; institution: string; period: string }[]>(settings.profile_education, [])
  const certs        = parseJSON<{ name: string; url?: string }[]>(settings.profile_certifications, [])
  const testimonials = parseJSON<{ name: string; role: string; text: string; avatar?: string; linkedin?: string }[]>(settings.profile_testimonials, [])

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className="blog-collection-sonic min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-fuchsia-500 selection:text-white">
      {user && <AdminBar />}
      <SonicNav settings={settings} user={user} currentPage="about" profileVisible={true} />

      <main className="max-w-5xl mx-auto px-6 pt-16 pb-32">

        {/* Hero split: image + bio */}
        <div className="mt-12 flex flex-col md:flex-row gap-12 items-stretch mb-20">
          {/* Image column */}
          {profileImage && (
            <div className="md:w-5/12 relative">
              <div className="absolute inset-0 bg-cyan-400 translate-x-3 translate-y-3 -z-10" />
              <div className="overflow-hidden border-2 border-zinc-800 bg-zinc-900 h-full min-h-72">
                <img
                  src={profileImage}
                  alt={profileName}
                  className="w-full h-full object-cover grayscale contrast-150"
                />
              </div>
            </div>
          )}

          {/* Bio column */}
          <div className={`${profileImage ? 'md:w-7/12' : 'w-full'} flex flex-col justify-center bg-zinc-900 p-8 md:p-12 border border-zinc-800`}>
            <span className="text-fuchsia-500 font-mono mb-4 block text-sm">{'>'} WHOAMI</span>
            <h1 className="font-black uppercase text-4xl md:text-6xl text-zinc-100 mb-8 tracking-tighter leading-[0.9]">
              {profileName || settings.blog_name || 'Blog'}
            </h1>
            <div className="font-mono text-sm text-zinc-400 leading-relaxed space-y-4">
              {profileSummary && <p>{profileSummary}</p>}
              {profileDescription && <p className="text-zinc-200">{profileDescription}</p>}
              {profileTitle && <p className="text-cyan-400 text-xs uppercase tracking-widest">{profileTitle}</p>}
            </div>

            {/* Social links */}
            {socialVisible && socialNetworks.length > 0 && (
              <div className="mt-10 pt-8 border-t-2 border-zinc-800 flex gap-5">
                {socialNetworks.map(({ key, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-cyan-400 transition-colors"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PDF download */}
        {downloadPdfVisible && (
          <div className="mb-12 flex justify-end">
            <AboutPdfButton
              styles={{}}
              settings={settings}
              collection="sonic"
              experienceVisible={experienceVisible}
              skillsVisible={skillsVisible}
              educationVisible={educationVisible}
              testimonialsVisible={testimonialsVisible}
              galleryVisible={galleryVisible}
              socialVisible={socialVisible}
            />
          </div>
        )}

        {/* Section wrapper — dark card aesthetic */}
        <div className="space-y-0">

          {/* Gallery */}
          {galleryVisible && gallery.length > 0 && (
            <section className="mb-16">
              <h2 className="font-black uppercase text-2xl text-zinc-100 tracking-tighter border-b-4 border-fuchsia-500 pb-2 inline-block mb-8">
                Gallery
              </h2>
              <div className="[&_img]:rounded-none [&_img]:grayscale [&_img:hover]:grayscale-0 [&_img]:transition-all [&_img]:border [&_img]:border-zinc-800 [&_button]:border-zinc-700 [&_button]:text-zinc-400">
                <AboutGallery data={gallery} />
              </div>
            </section>
          )}

          {/* Experience */}
          {experienceVisible && experience.length > 0 && (
            <section className="mb-16">
              <h2 className="font-black uppercase text-2xl text-zinc-100 tracking-tighter border-b-4 border-fuchsia-500 pb-2 inline-block mb-8">
                Experience
              </h2>
              <div className="[&_section]:mb-0 [&_h2]:hidden [&_.flex.items-center.mb-6]:hidden [&_[class*=bg-gray]]:!bg-zinc-900 [&_[class*=border-gray]]:!border-zinc-800 [&_[class*=text-gray-900]]:!text-zinc-100 [&_[class*=dark\\:text-white]]:!text-zinc-100 [&_span[class*=bg-]]:!bg-zinc-800 [&_span[class*=text-gray]]:!text-cyan-400">
                <AboutExperience data={experience} />
              </div>
            </section>
          )}

          {/* Skills */}
          {skillsVisible && skills.length > 0 && (
            <section className="mb-16">
              <h2 className="font-black uppercase text-2xl text-zinc-100 tracking-tighter border-b-4 border-fuchsia-500 pb-2 inline-block mb-8">
                Skills
              </h2>
              <div className="[&_section]:mb-0 [&_h2]:hidden [&_.flex.items-center.mb-6]:hidden [&_[class*=bg-gray]]:!bg-zinc-900 [&_[class*=border-gray]]:!border-zinc-800 [&_[class*=text-gray-900]]:!text-zinc-100 [&_[class*=dark\\:text-white]]:!text-zinc-100">
                <AboutSkills data={skills} />
              </div>
            </section>
          )}

          {/* Education */}
          {educationVisible && (education.length > 0 || certs.length > 0) && (
            <section className="mb-16">
              <h2 className="font-black uppercase text-2xl text-zinc-100 tracking-tighter border-b-4 border-fuchsia-500 pb-2 inline-block mb-8">
                Education
              </h2>
              <div className="[&_section]:mb-0 [&_h2]:hidden [&_.flex.items-center.mb-6]:hidden [&_.flex.items-center.mb-6.mt-10]:hidden [&_[class*=bg-gray]]:!bg-zinc-900 [&_[class*=border-gray]]:!border-zinc-800 [&_[class*=text-gray-900]]:!text-zinc-100 [&_[class*=dark\\:text-white]]:!text-zinc-100">
                <AboutEducation education={education} certifications={certs} />
              </div>
            </section>
          )}

          {/* Testimonials */}
          {testimonialsVisible && testimonials.length > 0 && (
            <section className="mb-16">
              <h2 className="font-black uppercase text-2xl text-zinc-100 tracking-tighter border-b-4 border-fuchsia-500 pb-2 inline-block mb-8">
                Testimonials
              </h2>
              <div className="[&_section]:mb-0 [&_h2]:hidden [&_.flex.items-center.mb-6]:hidden [&_[class*=bg-gray]]:!bg-zinc-900 [&_[class*=border-gray]]:!border-zinc-800 [&_[class*=text-gray-900]]:!text-zinc-100 [&_[class*=dark\\:text-white]]:!text-zinc-100 [&_button]:!bg-zinc-800 [&_button]:!border-zinc-700 [&_button]:!text-zinc-400">
                <AboutTestimonials data={testimonials} />
              </div>
            </section>
          )}

        </div>
      </main>

      <SonicFooter settings={settings} />
    </div>
  )
}
