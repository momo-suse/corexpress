/**
 * Atlas layout — travel/explorer photography journal.
 * Stone-50 background, amber-700 accent, emerald-950 secondary,
 * serif + mono typography, sharp 0px radius, desaturated images.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Wind,
  Camera,
  MapPin,
  ArrowLeft,
  Menu,
  X,
  Mail,
  MessageSquare,
  Briefcase,
  Code,
  GraduationCap,
  Award,
  ExternalLink,
} from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import AboutPdfButton from '@/components/blog/AboutPdfButton'
import { usePosts } from '@/hooks/usePosts'
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
    const result = JSON.parse(value ?? 'null') as T | null
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

// ── Type shims ────────────────────────────────────────────────────────────────

interface GalleryItem { url: string; title: string; description: string }
interface ExperienceItem { role: string; company: string; period: string; description: string; tags: string[] }
interface SkillGroup { name: string; skills: string[] }
interface EducationItem { degree: string; institution: string; period: string }
interface Certification { name: string; url?: string }
interface Testimonial { name: string; role: string; text: string; avatar?: string; linkedin?: string }

// ── AtlasNav ─────────────────────────────────────────────────────────────────

interface AtlasNavProps {
  settings: Record<string, string>
  user: boolean
  currentPage: 'home' | 'post' | 'about'
  profileVisible?: boolean
}

function AtlasNav({ settings, user, currentPage, profileVisible = true }: AtlasNavProps) {
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const blogName = settings.blog_name || 'Blog'

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  const availableLangs = ['en', 'es', 'ja']
  const currentLang = i18n.language?.slice(0, 2) ?? 'en'

  return (
    <div className={`sticky z-40 w-full ${user ? 'top-9' : 'top-0'}`}>
      <nav className="w-full bg-stone-50 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Left: nav links */}
          <div className="hidden sm:flex gap-6">
            <Link
              to="/"
              className={`font-sans text-xs tracking-[0.3em] uppercase transition-colors ${
                currentPage === 'home'
                  ? 'text-emerald-950 border-b border-emerald-950 pb-0.5'
                  : 'text-stone-500 hover:text-amber-700'
              }`}
            >
              {t('blog.atlas.logbook', { defaultValue: 'Bitácora' })}
            </Link>
            {profileVisible && (
              <Link
                to="/about"
                className={`font-sans text-xs tracking-[0.3em] uppercase transition-colors ${
                  currentPage === 'about'
                    ? 'text-emerald-950 border-b border-emerald-950 pb-0.5'
                    : 'text-stone-500 hover:text-amber-700'
                }`}
              >
                {t('blog.atlas.photographer', { defaultValue: 'El Fotógrafo' })}
              </Link>
            )}
          </div>

          {/* Center: brand — text only, no logo image */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-tight hover:opacity-75 transition-opacity"
          >
            <span className="font-serif text-2xl md:text-3xl text-emerald-950 tracking-tight leading-none">
              {blogName}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
              {t('blog.atlas.journalLabel', { defaultValue: 'Journal' })}
            </span>
          </Link>

          {/* Right: social + language pills (lang pills only on lg+ to avoid overlap) */}
          <div className="hidden sm:flex items-center gap-3">
            {socialNetworks.map(({ key, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="text-stone-400 hover:text-amber-700 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
            <div className="hidden lg:flex gap-1 ml-2">
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border transition-colors ${
                    currentLang === lang
                      ? 'bg-emerald-950 text-stone-50 border-emerald-950'
                      : 'border-stone-300 text-stone-400 hover:border-amber-700 hover:text-amber-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="sm:hidden p-1 text-stone-500 hover:text-emerald-950 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('blog.nav.closeMenu') : t('blog.nav.openMenu')}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden bg-stone-50 border-t border-stone-200 px-6 py-4 flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="font-sans text-xs tracking-[0.3em] uppercase text-stone-500 hover:text-amber-700 transition-colors"
            >
              {t('blog.atlas.logbook', { defaultValue: 'Bitácora' })}
            </Link>
            {profileVisible && (
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="font-sans text-xs tracking-[0.3em] uppercase text-stone-500 hover:text-amber-700 transition-colors"
              >
                {t('blog.atlas.photographer', { defaultValue: 'El Fotógrafo' })}
              </Link>
            )}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { i18n.changeLanguage(lang); setMobileOpen(false) }}
                  className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border transition-colors ${
                    currentLang === lang
                      ? 'bg-emerald-950 text-stone-50 border-emerald-950'
                      : 'border-stone-300 text-stone-400 hover:border-amber-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
              {socialNetworks.map(({ key, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-amber-700 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Coordinate strip */}
      <div className="bg-stone-50 border-b border-stone-200 py-1 text-center font-mono text-[10px] uppercase tracking-widest text-stone-400">
        40°42′N · 74°00′W · {new Date().getFullYear()}
      </div>
    </div>
  )
}

// ── AtlasFooter ───────────────────────────────────────────────────────────────

function AtlasFooter({ settings }: { settings: Record<string, string> }) {
  const { t } = useTranslation()
  const blogName = settings.blog_name || 'Blog'

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <footer className="bg-stone-100 border-t border-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <span className="font-serif text-2xl text-emerald-950 opacity-60">{blogName}</span>

        <div className="flex justify-center gap-4">
          {socialNetworks.map(({ key, href, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key}
              className="text-stone-400 hover:text-amber-700 transition-colors"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        <p className="font-mono text-xs text-stone-400 uppercase tracking-widest text-center md:text-right">
          © {new Date().getFullYear()} {blogName} · {t('blog.footer.rights')}
        </p>
      </div>
    </footer>
  )
}

// ── AtlasBlogHome ─────────────────────────────────────────────────────────────

interface AtlasBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  heroVisible: boolean
  postListVisible: boolean
  profileVisible: boolean
  socialVisible: boolean
  searchVisible: boolean
  tagCloudVisible: boolean
  searchQuery: string
  onSearch: (q: string) => void
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
}

export function AtlasBlogHome({
  settings,
  user,
  heroVisible,
  postListVisible,
  profileVisible,
  socialVisible: _socialVisible,
  searchVisible,
  tagCloudVisible,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: AtlasBlogHomeProps) {
  const { t } = useTranslation()
  const blogName = settings.blog_name || 'Blog'
  const profileName = settings.profile_name || blogName
  const profileSummary = settings.profile_summary || ''
  const profileImageUrl = settings.profile_image_url || ''
  const heroText = settings.hero_text || blogName

  const { data: postsData } = usePosts(1, false, searchQuery, activeTag)
  const posts = postsData?.data ?? []
  const featured = posts[0] ?? null
  const restPosts = posts.slice(1)

  return (
    <div className="blog-collection-atlas min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-amber-700 selection:text-white">
      {user && <AdminBar />}
      <AtlasNav user={user} settings={settings} currentPage="home" profileVisible={profileVisible} />

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        {heroVisible && (
          <div className="mb-20 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-amber-700">
              <Wind size={14} />
              <span className="font-sans font-bold tracking-[0.3em] text-xs uppercase">
                {t('blog.atlas.journalLabel', { defaultValue: 'Journal' })}
              </span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl text-emerald-950 leading-tight">
              {heroText}
            </h1>
            <p className="font-serif italic text-2xl text-stone-500 mt-4">
              {t('blog.atlas.chronicles', { defaultValue: 'Crónicas de un mundo ancho' })}
            </p>
          </div>
        )}

        {/* ── Search + Tags strip ───────────────────────────────────────── */}
        {(searchVisible || tagCloudVisible) && (
          <div className="max-w-3xl mx-auto mb-24">
            {searchVisible && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSearch((e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim())
                }}
                className="flex border border-stone-300 mb-4"
              >
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={t('blog.search.placeholder')}
                  className="flex-1 px-4 py-2 bg-transparent font-mono text-sm text-stone-700 outline-none placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-950 text-stone-50 font-mono text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-colors shrink-0"
                >
                  {t('blog.search.button')}
                </button>
              </form>
            )}
            {tagCloudVisible && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTagSelect('')}
                  className={`font-mono text-[10px] uppercase px-3 py-1 border transition-colors ${
                    !activeTag
                      ? 'bg-emerald-950 text-stone-50 border-emerald-950'
                      : 'border-stone-300 text-stone-500 hover:border-amber-700 hover:text-amber-700'
                  }`}
                >
                  {t('blog.search.allPosts', { defaultValue: 'All' })}
                </button>
                {tags.map(({ tag }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagSelect(activeTag === tag ? '' : tag)}
                    className={`font-mono text-[10px] uppercase px-3 py-1 border transition-colors ${
                      activeTag === tag
                        ? 'bg-emerald-950 text-stone-50 border-emerald-950'
                        : 'border-stone-300 text-stone-500 hover:border-amber-700 hover:text-amber-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Featured post ─────────────────────────────────────────────── */}
        {postListVisible && featured && (
          <Link to={`/post/${featured.slug}`} className="group block mb-20">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Image 3/5 */}
              <div className="md:w-3/5 relative overflow-hidden bg-stone-200">
                {featured.featured_image_url ? (
                  <img
                    src={featured.featured_image_url}
                    alt={featured.title}
                    className="w-full h-64 md:h-96 object-cover transition-transform duration-[2s] group-hover:scale-105"
                    style={{ filter: 'saturate(50%) contrast(110%)' }}
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 bg-stone-200 flex items-center justify-center">
                    <Camera size={32} className="text-stone-400" />
                  </div>
                )}
                {featured.tags && (
                  <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-widest bg-stone-950/60 text-stone-100 px-2 py-1">
                    {firstTag(featured.tags)}
                  </div>
                )}
              </div>

              {/* Text 2/5 */}
              <div className="md:w-2/5 flex flex-col justify-center">
                {firstTag(featured.tags) && (
                  <span className="font-sans text-xs uppercase tracking-widest text-emerald-950 border-b border-emerald-950 pb-0.5 mb-4 self-start">
                    {firstTag(featured.tags)}
                  </span>
                )}
                <h2 className="font-serif text-4xl md:text-5xl text-emerald-950 leading-tight mb-6 group-hover:text-amber-700 transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="font-serif text-stone-600 leading-relaxed mb-6 text-lg">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 font-mono text-xs text-stone-500 mb-8">
                  <span>{formatDate(featured.created_at)}</span>
                  <span>·</span>
                  <span>{readingTime(featured.content ?? '')}</span>
                </div>
                <span className="flex items-center gap-2 font-sans text-sm font-bold text-amber-700 uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                  {t('blog.atlas.readChronicle', { defaultValue: 'Leer crónica' })}
                  <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* ── Profile card ──────────────────────────────────────────────── */}
        {profileVisible && (
          <Link to="/about" className="group block mb-20">
            <div className="bg-emerald-950 text-stone-100 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={profileName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-700 shrink-0"
                  style={{ filter: 'sepia(0.3)' }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-emerald-800 border-4 border-amber-700 shrink-0" />
              )}
              <div className="flex-1 text-center md:text-left">
                <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                  {t('blog.atlas.photographer', { defaultValue: 'El Fotógrafo' })}
                </p>
                <h3 className="font-serif text-3xl text-stone-50 mb-3">{profileName}</h3>
                {profileSummary && (
                  <p className="font-serif text-stone-300 leading-relaxed">{profileSummary}</p>
                )}
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-amber-700 group-hover:text-stone-50 transition-colors shrink-0">
                {t('blog.nav.about')} →
              </span>
            </div>
          </Link>
        )}

        {/* ── Post grid ─────────────────────────────────────────────────── */}
        {postListVisible && restPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
                {t('blog.atlas.recentDispatches', { defaultValue: 'Despachos recientes' })}
              </h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restPosts.map((post) => (
                <Link key={post.id} to={`/post/${post.slug}`} className="group block">
                  {/* Photo-print frame effect */}
                  <div className="w-full aspect-[3/4] bg-white p-2 border border-stone-200 shadow-sm relative mb-4 overflow-hidden">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-all duration-700"
                        style={{ filter: 'saturate(50%) contrast(110%)' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                        <Camera size={24} className="text-stone-300" />
                      </div>
                    )}
                    {/* Circular amber camera badge */}
                    <div className="absolute top-4 right-4 bg-amber-700 text-white w-8 h-8 rounded-full
                                    flex items-center justify-center shadow-sm
                                    rotate-12 group-hover:rotate-0 transition-transform duration-300">
                      <Camera size={13} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-emerald-950 leading-snug mb-2 group-hover:text-amber-700 transition-colors">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                      <span>{formatDate(post.created_at)}</span>
                      {post.tags && (
                        <>
                          <span>·</span>
                          <MapPin size={10} />
                          <span>{firstTag(post.tags)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {postListVisible && posts.length === 0 && (
          <p className="font-serif text-center text-stone-400 text-lg py-20">
            {t('blog.posts.noResults')}
          </p>
        )}

      </main>

      <AtlasFooter settings={settings} />
    </div>
  )
}

// ── AtlasPostContent ──────────────────────────────────────────────────────────

interface AtlasPostContentProps {
  post: Post
  relatedPosts: Post[]
  settings: Record<string, string>
  user: boolean
  commentsEnabled: boolean
  profileVisible: boolean
  socialVisible: boolean
  onCommentSubmitted: () => void
  availableLocales: string[]
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

export function AtlasPostContent({
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
}: AtlasPostContentProps) {
  const { t } = useTranslation()

  return (
    <div className="blog-collection-atlas min-h-screen bg-stone-50 font-sans">
      {user && <AdminBar />}
      <AtlasNav user={user} settings={settings} currentPage="post" profileVisible={profileVisible} />

      <article className="max-w-4xl mx-auto px-6 pt-12 pb-32">

        {/* ── Post header ───────────────────────────────────────────────── */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl md:text-7xl text-emerald-950 leading-tight mb-6 text-center">
            {post.title}
          </h1>

          <div className="flex items-center justify-center gap-3 font-mono text-xs text-stone-400 uppercase tracking-widest">
            <span>{formatDate(post.created_at)}</span>
            <span>·</span>
            <span>{readingTime(post.content ?? '')} {t('blog.post.readingTime')}</span>
          </div>
        </div>

        {/* ── Locale switcher ───────────────────────────────────────────── */}
        {availableLocales.length > 1 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {availableLocales.map((locale) => (
              <button
                key={locale}
                onClick={() => onLocaleChange(locale)}
                className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentLocale === locale
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'border-stone-300 text-stone-500 hover:border-amber-700 hover:text-amber-700'
                }`}
              >
                {locale}
              </button>
            ))}
          </div>
        )}

        {/* ── Featured image ────────────────────────────────────────────── */}
        {post.featured_image_url && (
          <figure className="mb-12">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full max-h-[540px] object-cover border-8 border-white shadow-md"
              style={{ filter: 'saturate(50%) contrast(110%)' }}
            />
            <figcaption className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mt-2 text-center">
              {post.title}
            </figcaption>
          </figure>
        )}

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div
          className="prose prose-stone prose-xl max-w-3xl mx-auto mb-20
            prose-headings:font-serif prose-headings:italic prose-headings:font-light prose-headings:text-emerald-950
            prose-p:font-serif prose-p:leading-[2] prose-p:text-stone-700
            prose-blockquote:font-serif prose-blockquote:text-2xl prose-blockquote:text-stone-800
            prose-blockquote:border-y prose-blockquote:border-stone-300 prose-blockquote:border-l-0
            prose-blockquote:py-12 prose-blockquote:bg-stone-100/50 prose-blockquote:text-center
            [&_a]:![color:var(--blog-accent)]"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />

        {/* ── Map embed ─────────────────────────────────────────────────── */}
        {post.map_embed_url && (
          <div className="mb-12 border border-stone-200 overflow-hidden">
            <iframe
              src={post.map_embed_url}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              title={t('blog.post.location')}
            />
          </div>
        )}

        {/* ── Related posts ─────────────────────────────────────────────── */}
        {relatedPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
                {t('blog.atlas.continueExploring', { defaultValue: 'Continuar explorando' })}
              </h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.slice(0, 4).map((related) => (
                <Link
                  key={related.id}
                  to={`/post/${related.slug}`}
                  className="group flex gap-6 bg-white p-4 border border-stone-200 hover:border-amber-700 transition-colors"
                >
                  {related.featured_image_url ? (
                    <img
                      src={related.featured_image_url}
                      alt={related.title}
                      className="w-24 h-24 object-cover shrink-0"
                      style={{ filter: 'saturate(50%) contrast(110%)' }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-stone-100 shrink-0 flex items-center justify-center">
                      <Camera size={16} className="text-stone-400" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                      {formatDate(related.created_at)}
                    </p>
                    <h3 className="font-serif text-emerald-950 leading-snug group-hover:text-amber-700 transition-colors">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Back button ───────────────────────────────────────────────── */}
        <Link
          to="/"
          className="inline-flex items-center gap-3 border border-emerald-950 text-emerald-950 hover:bg-emerald-950 hover:text-white transition-colors px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.2em] mb-16"
        >
          <ArrowLeft size={14} />
          {t('blog.atlas.backToJournal', { defaultValue: 'Volver a la bitácora' })}
        </Link>

        {/* ── Comments ──────────────────────────────────────────────────── */}
        {commentsEnabled && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare size={18} className="text-amber-700" />
              <h2 className="font-serif italic text-2xl text-emerald-950">
                {t('blog.atlas.readerMail', { defaultValue: 'Correos del lector' })}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Comment list — 3/5 */}
              <div className="md:col-span-3 atlas-comment-list">
                <CommentList postId={post.id} />
              </div>

              {/* Comment form — 2/5 */}
              <div className="md:col-span-2 atlas-comment-form">
                <div className="bg-stone-200/50 border border-stone-300 p-6">
                  <h3 className="font-serif italic text-xl text-emerald-950 mb-4">
                    {t('blog.atlas.leaveDispatch', { defaultValue: 'Dejar un despacho' })}
                  </h3>
                  <CommentForm postId={post.id} onSubmitted={onCommentSubmitted} />
                </div>
              </div>
            </div>
          </div>
        )}

      </article>

      <AtlasFooter settings={settings} />
    </div>
  )
}

// ── AtlasAboutContent ─────────────────────────────────────────────────────────

interface AtlasAboutContentProps {
  settings: Record<string, string>
  user: boolean
  galleryVisible: boolean
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  socialVisible: boolean
  downloadPdfVisible: boolean
}

export function AtlasAboutContent({
  settings,
  user,
  galleryVisible,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  socialVisible,
  downloadPdfVisible,
}: AtlasAboutContentProps) {
  const { t } = useTranslation()

  const profileName    = settings.profile_name || settings.blog_name || 'Atlas'
  const profileSummary = settings.profile_summary || ''
  const profileBio     = settings.profile_description || ''
  const profileImageUrl = settings.profile_image_url || ''
  const emailAddress   = settings.contact_email || ''

  // Parse JSON arrays
  const gallery      = parseJSON<GalleryItem[]>(settings.profile_gallery, [])
  const experience   = parseJSON<ExperienceItem[]>(settings.profile_experience, [])
  const skills       = parseJSON<SkillGroup[]>(settings.profile_skills, [])
  const education    = parseJSON<EducationItem[]>(settings.profile_education, [])
  const certs        = parseJSON<Certification[]>(settings.profile_certifications, [])
  const testimonials = parseJSON<Testimonial[]>(settings.profile_testimonials, [])

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className="blog-collection-atlas min-h-screen bg-stone-50 font-sans">
      {user && <AdminBar />}
      <AtlasNav user={user} settings={settings} currentPage="about" profileVisible={true} />

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-32 space-y-24">

        {/* ── Hero section ─────────────────────────────────────────────── */}
        <section className="bg-white p-6 md:p-12 shadow-sm border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            {/* Photo — 5/12 */}
            <div className="md:col-span-5 relative">
              <div className="relative inline-block w-full">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={profileName}
                    className="w-full aspect-[4/5] object-cover border-8 border-white shadow-lg"
                    style={{ transform: 'rotate(-2deg)' }}
                  />
                ) : (
                  <div
                    className="w-full aspect-[4/5] bg-stone-100 border-8 border-white shadow-lg flex items-center justify-center"
                    style={{ transform: 'rotate(-2deg)' }}
                  >
                    <Camera size={40} className="text-stone-300" />
                  </div>
                )}
                {/* Amber badge */}
                <div
                  className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-amber-700 flex items-center justify-center text-white font-serif text-lg shadow-md"
                  style={{ transform: 'rotate(12deg)' }}
                >
                  Hola.
                </div>
              </div>
            </div>

            {/* Text — 7/12 */}
            <div className="md:col-span-7 flex flex-col justify-center">
              <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-4">
                {t('blog.about.aboutMe')}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl text-emerald-950 leading-tight mb-6">
                {profileName}
              </h1>
              {(profileBio || profileSummary) && (
                <p className="font-serif text-lg text-stone-600 leading-[2] mb-8">
                  {profileBio || profileSummary}
                </p>
              )}
              {emailAddress && (
                <a
                  href={`mailto:${emailAddress}`}
                  className="flex items-center gap-2 font-mono text-sm text-amber-700 hover:text-emerald-950 transition-colors mb-6 self-start"
                >
                  <Mail size={14} />
                  {emailAddress}
                </a>
              )}
              {downloadPdfVisible && (
                <div className="self-start">
                  <AboutPdfButton
                    styles={{}}
                    settings={settings}
                    collection="atlas"
                    experienceVisible={experienceVisible}
                    skillsVisible={skillsVisible}
                    educationVisible={educationVisible}
                    testimonialsVisible={testimonialsVisible}
                    galleryVisible={galleryVisible}
                    socialVisible={socialVisible}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Gallery — polaroid grid ──────────────────────────────────── */}
        {galleryVisible && gallery.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-serif italic text-2xl text-emerald-950">{t('blog.about.galleryTitle')}</h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-[3px] border border-stone-200 shadow-md"
                  style={{ transform: idx % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1.5deg)' }}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full aspect-square object-cover block"
                    style={{ filter: 'saturate(50%) contrast(110%)' }}
                  />
                  {item.title && (
                    <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 text-center pt-2 pb-1 px-1 truncate">
                      {item.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Experience ───────────────────────────────────────────────── */}
        {experienceVisible && experience.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Briefcase size={18} className="text-amber-700 shrink-0" />
              <h2 className="font-serif italic text-2xl text-emerald-950">{t('blog.about.experience')}</h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="space-y-4">
              {experience.map((item, idx) => (
                <div key={idx} className="bg-white border border-stone-200 p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-serif text-lg text-emerald-950">{item.role}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mt-0.5">{item.company}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 border border-stone-300 px-2 py-0.5 shrink-0">
                      {item.period}
                    </span>
                  </div>
                  <p className="font-serif text-stone-600 text-sm leading-relaxed mb-4">{item.description}</p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="font-mono text-[10px] uppercase tracking-widest border border-stone-300 text-stone-600 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Skills ───────────────────────────────────────────────────── */}
        {skillsVisible && skills.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Code size={18} className="text-amber-700 shrink-0" />
              <h2 className="font-serif italic text-2xl text-emerald-950">{t('blog.about.skills')}</h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {skills.map((group) => (
                <div key={group.name} className="bg-stone-50 border border-stone-200 p-5 shadow-sm">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-3">{group.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span key={skill} className="font-mono text-[10px] uppercase tracking-widest border border-stone-300 text-stone-600 px-2 py-0.5">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Education ────────────────────────────────────────────────── */}
        {educationVisible && (education.length > 0 || certs.length > 0) && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <GraduationCap size={18} className="text-amber-700 shrink-0" />
              <h2 className="font-serif italic text-2xl text-emerald-950">{t('blog.about.education')}</h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {education.length > 0 && (
                <div className="bg-white border border-stone-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                    {t('blog.about.education')}
                  </h3>
                  {education.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="p-2.5 bg-amber-700/10 shrink-0">
                        <GraduationCap size={18} className="text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm text-emerald-950">{item.degree}</h4>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mt-0.5">
                          {item.institution} · {item.period}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {certs.length > 0 && (
                <div className="bg-white border border-stone-200 p-6 shadow-sm">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-4">
                    {t('blog.about.certifications')}
                  </h3>
                  <ul className="space-y-3">
                    {certs.map((cert, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="p-2 bg-amber-700/10 shrink-0">
                          <Award size={16} className="text-amber-700" />
                        </div>
                        {cert.url ? (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-stone-600 flex items-center gap-1.5 hover:text-amber-700 transition-colors"
                          >
                            {cert.name}
                            <ExternalLink size={12} className="opacity-50" />
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-stone-600">{cert.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        {testimonialsVisible && testimonials.length > 0 && (
          <div className="bg-emerald-950 text-stone-100 p-8 md:p-12 atlas-testimonials">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-serif italic text-2xl text-amber-700">
                {t('blog.about.testimonials')}
              </h2>
              <div className="flex-1 h-px bg-emerald-800" />
            </div>
            <AboutTestimonials data={testimonials} />
          </div>
        )}

        {/* ── Social links ─────────────────────────────────────────────── */}
        {socialVisible && socialNetworks.length > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-stone-200" />
              <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
                {t('blog.socialLinks.connect')}
              </p>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="flex justify-center gap-6">
              {socialNetworks.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="text-stone-400 hover:text-amber-700 transition-colors"
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      <AtlasFooter settings={settings} />
    </div>
  )
}
