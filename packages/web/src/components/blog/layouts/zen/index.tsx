/**
 * Zen layout — warm minimalist style collection.
 * Cream background (#F7F5F0), terracotta accent (#A8624A), serif headings,
 * two-column hero, cinematic featured post, 2-column post grid, circular related posts.
 * Based on blog4.html reference design.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import LanguageSwitcher from '@/components/blog/LanguageSwitcher'
import SearchBar from '@/components/blog/SearchBar'
import TagCloud from '@/components/blog/TagCloud'
import LikeButton from '@/components/blog/LikeButton'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AboutHero from '@/components/blog/AboutHero'
import AboutGallery from '@/components/blog/AboutGallery'
import AboutExperience from '@/components/blog/AboutExperience'
import AboutSkills from '@/components/blog/AboutSkills'
import AboutEducation from '@/components/blog/AboutEducation'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import AboutPdfButton from '@/components/blog/AboutPdfButton'
import SubscriberSection from '@/components/blog/SubscriberSection'
import { usePosts } from '@/hooks/usePosts'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Post, TagItem } from '@/types/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
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

// ── ZenFooter (shared) ────────────────────────────────────────────────────────

interface ZenFooterProps {
  settings: Record<string, string>
  socialVisible?: boolean
}

function ZenFooter({ settings, socialVisible }: ZenFooterProps) {
  const { t } = useTranslation()
  return (
    <footer
      className="border-t py-16 mt-8 shrink-0"
      style={{ borderColor: '#E8E2D5', background: 'var(--blog-bg, #F7F5F0)' }}
    >
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="font-serif text-3xl" style={{ color: '#2D2B2A' }}>
          {settings.blog_name || 'Blog'}
        </span>
        {socialVisible && (
          <div className="flex items-center gap-5">
            {Object.entries(SOCIAL_ICON_MAP)
              .filter(([key]) => settings[key])
              .map(([key, Icon]) => (
                <a
                  key={key}
                  href={settings[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-300"
                  style={{ color: '#8A857E' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--blog-accent)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#8A857E')}
                >
                  <Icon size={18} />
                </a>
              ))}
          </div>
        )}
        <p className="font-sans text-xs uppercase" style={{ color: '#8A857E' }}>
          © {new Date().getFullYear()} {settings.blog_name}. {t('blog.footer.rights')}
        </p>
      </div>
    </footer>
  )
}

// ── ZenNav ────────────────────────────────────────────────────────────────────

interface ZenNavProps {
  settings: Record<string, string>
  currentPage: 'home' | 'post' | 'about'
  profileVisible: boolean
  user: boolean
  subscriberVisible?: boolean
}

function ZenNav({ settings, currentPage, profileVisible, user, subscriberVisible = false }: ZenNavProps) {
  const { t } = useTranslation()
  const blogName = settings.blog_name || 'Blog'
  const logoUrl = settings.blog_logo_url

  const socialNetworks = Object.entries(SOCIAL_ICON_MAP)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <nav
      className={`sticky z-40 w-full border-b ${user ? 'top-9' : 'top-0'}`}
      style={{ borderColor: '#E8E2D5', background: 'var(--blog-bg, #F7F5F0)' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-5 md:py-6 flex items-center justify-between relative">

        {/* LEFT: nav links */}
        <div className="flex items-center gap-8 text-xs uppercase tracking-widest">
          <Link
            to="/"
            className="transition-colors duration-300"
            style={{ color: currentPage === 'home' ? 'var(--blog-accent)' : '#8A857E' }}
          >
            {t('blog.nav.home')}
          </Link>
          {profileVisible && (
            <Link
              to="/about"
              className="transition-colors duration-300"
              style={{ color: currentPage === 'about' ? 'var(--blog-accent)' : '#8A857E' }}
            >
              {t('blog.nav.about')}
            </Link>
          )}
        </div>

        {/* CENTER: brand name — absolutely centered */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <Link to="/" className="pointer-events-auto flex items-center gap-2">
            {logoUrl && (
              <img src={logoUrl} alt={blogName} className="h-6 w-6 rounded-full object-cover" />
            )}
            <span
              className="font-serif text-2xl md:text-3xl"
              style={{ color: '#2D2B2A' }}
            >
              {blogName}
            </span>
          </Link>
        </div>

        {/* RIGHT: social icons + language switcher */}
        <div className="flex items-center gap-4">
          {socialNetworks.map(({ key, href, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:opacity-70"
              style={{ color: '#8A857E' }}
            >
              <Icon size={16} />
            </a>
          ))}
          <LanguageSwitcher variant="classic" />
          <SubscriberSection collection="zen" subscriberVisible={subscriberVisible} settings={settings} />
        </div>
      </div>
    </nav>
  )
}

// ── ZenBlogHome ───────────────────────────────────────────────────────────────

interface ZenBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  profileVisible: boolean
  socialVisible: boolean
  postListVisible: boolean
  heroVisible: boolean
  subscriberVisible: boolean
  searchVisible: boolean
  tagCloudVisible: boolean
  searchQuery: string
  onSearch: (query: string) => void
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
}

export function ZenBlogHome({
  settings,
  user,
  profileVisible,
  socialVisible,
  postListVisible,
  heroVisible,
  subscriberVisible,
  searchVisible,
  tagCloudVisible,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: ZenBlogHomeProps) {
  const { t } = useTranslation()
  const { data: postsData } = usePosts(1, false, searchQuery, activeTag)
  const posts = postsData?.data ?? []
  const [featured, ...rest] = posts

  return (
    <div
      className="blog-collection-zen min-h-screen flex flex-col"
      style={{ background: 'var(--blog-bg, #F7F5F0)', color: '#2D2B2A' }}
    >
      {user && <AdminBar />}
      <ZenNav settings={settings} currentPage="home" profileVisible={profileVisible} user={user} subscriberVisible={subscriberVisible} />

      <main className="flex-1 max-w-5xl mx-auto px-6 w-full pt-10">

        {/* ── Search ────────────────────────────────────────── */}
        {searchVisible && (
          <div className="mt-10 mb-10">
            <SearchBar variant="editorial" styles={{}} onSearch={onSearch} initialQuery={searchQuery} />
          </div>
        )}

        {/* ── Hero ──────────────────────────────────────────── */}
        {heroVisible && (
          <header className="mt-8 mb-16 flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Text column */}
            <div className="md:w-1/2">
              <h1
                className="font-serif text-5xl md:text-6xl leading-[1.15] mb-8"
                style={{ color: '#2D2B2A' }}
              >
                {settings.hero_text || t('blog.hero.welcome')}
              </h1>
              {settings.blog_description && (
                <p className="uppercase text-sm flex items-center gap-3" style={{ color: '#8A857E' }}>
                  <span
                    className="inline-block w-12 shrink-0"
                    style={{ height: '1px', background: 'var(--blog-accent)' }}
                  />
                  {settings.blog_description}
                </p>
              )}
            </div>
            {/* Image column */}
            {settings.hero_image_url && (
              <div
                className="md:w-1/2 w-full aspect-square md:aspect-[4/5] rounded-[2rem] shadow-sm overflow-hidden shrink-0"
              >
                <img
                  src={settings.hero_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </header>
        )}

        {/* ── Tag cloud ─────────────────────────────────────── */}
        {tagCloudVisible && tags.length > 0 && (
          <div className="mb-12 border-t border-b py-6" style={{ borderColor: '#E8E2D5' }}>
            <p className="text-xs uppercase tracking-widest mb-4 flex items-center gap-3" style={{ color: '#8A857E' }}>
              <span className="inline-block w-6 shrink-0" style={{ height: '1px', background: 'var(--blog-accent)' }} />
              {t('blog.tags.explore')}
            </p>
            <TagCloud bare tags={tags} activeTag={activeTag} onTagSelect={onTagSelect} styles={{}} />
          </div>
        )}

        {/* ── Profile (mini author card) ─────────────────────── */}
        {profileVisible && (settings.profile_name || settings.profile_summary) && (
          <section className="mb-20 flex items-center gap-6">
            {settings.profile_image_url && (
              <img
                src={settings.profile_image_url}
                alt={settings.profile_name || ''}
                className="w-16 h-16 rounded-full object-cover shadow-sm shrink-0"
              />
            )}
            <div>
              {settings.profile_name && (
                <p className="font-serif text-lg mb-1" style={{ color: '#2D2B2A' }}>
                  {settings.profile_name}
                </p>
              )}
              {settings.profile_summary && (
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#8A857E' }}>
                  {settings.profile_summary}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── Posts ─────────────────────────────────────────── */}
        {postListVisible && (
          <>
            {/* Featured post */}
            {featured && (
              <Link to={`/post/${featured.slug}`} className="group mb-40 block">
                {featured.featured_image_url && (
                  <div className="w-full aspect-video md:aspect-[21/9] rounded-[2rem] shadow-sm overflow-hidden mb-12">
                    <img
                      src={featured.featured_image_url}
                      alt={featured.title}
                      className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                      style={{ filter: 'var(--blog-img-filter)' }}
                    />
                  </div>
                )}
                <div className="max-w-3xl mx-auto text-center">
                  {firstTag(featured.tags) && (
                    <p
                      className="text-xs uppercase tracking-widest mb-6"
                      style={{ color: 'var(--blog-accent)' }}
                    >
                      {firstTag(featured.tags)}
                    </p>
                  )}
                  <h2
                    className="font-serif text-4xl md:text-5xl mb-6 transition-colors duration-500"
                    style={{ color: '#2D2B2A' }}
                  >
                    <span className="group-hover:text-[var(--blog-accent)] transition-colors duration-500">
                      {featured.title}
                    </span>
                  </h2>
                  {featured.excerpt && (
                    <p
                      className="text-xl font-light leading-relaxed mb-8"
                      style={{ color: '#6B655E' }}
                    >
                      {featured.excerpt}
                    </p>
                  )}
                  <span
                    className="inline-flex items-center gap-2 text-sm uppercase tracking-widest group-hover:gap-4 transition-all duration-300"
                    style={{ color: '#8A857E' }}
                  >
                    {t('blog.posts.readArticle')} <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            )}

            {/* Post grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24 mb-24">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug}`}
                    className="group flex flex-col"
                  >
                    {post.featured_image_url && (
                      <div className="w-full aspect-[4/3] rounded-[2rem] shadow-sm overflow-hidden mb-8">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                          style={{ filter: 'var(--blog-img-filter)' }}
                        />
                      </div>
                    )}
                    {firstTag(post.tags) && (
                      <p
                        className="text-xs uppercase font-bold mb-4"
                        style={{ color: 'var(--blog-accent)' }}
                      >
                        {firstTag(post.tags)}
                      </p>
                    )}
                    <h3
                      className="font-serif text-3xl mb-4 group-hover:text-[var(--blog-accent)] transition-colors duration-500"
                      style={{ color: '#2D2B2A' }}
                    >
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p
                        className="text-lg font-light flex-grow mb-6 leading-relaxed"
                        style={{ color: '#6B655E' }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                    <span className="text-xs uppercase" style={{ color: '#8A857E' }}>
                      {formatDate(post.created_at ?? '')}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {posts.length === 0 && (
              <p className="text-center py-24" style={{ color: '#8A857E' }}>
                {t('blog.posts.noResults')}
              </p>
            )}
          </>
        )}

      </main>

      <ZenFooter settings={settings} socialVisible={socialVisible} />
    </div>
  )
}

// ── ZenPostContent ────────────────────────────────────────────────────────────

interface ZenPostContentProps {
  post: Post
  relatedPosts: Post[]
  settings: Record<string, string>
  user: boolean
  commentsEnabled: boolean
  likesEnabled: boolean
  profileVisible: boolean
  socialVisible: boolean
  subscriberVisible: boolean
  onCommentSubmitted: () => void
  availableLocales?: string[]
  currentLocale?: string
  onLocaleChange?: (locale: string) => void
}

export function ZenPostContent({
  post,
  relatedPosts,
  settings,
  user,
  commentsEnabled,
  likesEnabled,
  profileVisible,
  socialVisible,
  subscriberVisible,
  onCommentSubmitted,
  availableLocales,
  currentLocale,
  onLocaleChange,
}: ZenPostContentProps) {
  const { t } = useTranslation()
  const tag = firstTag(post.tags)

  const allTags = post.tags
    ? post.tags.split(',').map((tg) => tg.trim()).filter(Boolean)
    : []

  return (
    <div
      className="blog-collection-zen min-h-screen flex flex-col"
      style={{ background: 'var(--blog-bg, #F7F5F0)', color: '#2D2B2A' }}
    >
      {user && <AdminBar />}
      <ZenNav settings={settings} currentPage="post" profileVisible={profileVisible} user={user} subscriberVisible={subscriberVisible} />

      <article className="flex-1 max-w-3xl mx-auto px-6 w-full">

        {/* ── Header (centered) ─────────────────────────────── */}
        <header className="text-center mt-12 mb-20">
          {/* Category + date */}
          <p
            className="text-sm uppercase font-bold mb-8"
            style={{ color: 'var(--blog-accent)' }}
          >
            {tag && <>{tag}{post.created_at ? ' — ' : ''}</>}
            {post.created_at && formatDate(post.created_at)}
          </p>

          {/* Title */}
          <h1
            className="font-serif text-5xl md:text-6xl leading-[1.15] mb-10"
            style={{ color: '#2D2B2A' }}
          >
            {post.title}
          </h1>

          {/* Reading time */}
          <p className="font-sans text-xl italic" style={{ color: '#8A857E' }}>
            {t('blog.post.readingTime')} {readingTime(post.content ?? '')} min
          </p>

          {/* Post content locale switcher (not UI language) */}
          {availableLocales && availableLocales.length > 1 && onLocaleChange && (
            <div className="mt-6 flex justify-center gap-2">
              {availableLocales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => onLocaleChange(loc)}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full transition-colors duration-300"
                  style={
                    currentLocale === loc
                      ? { background: 'var(--blog-accent)', color: '#F7F5F0' }
                      : { background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }
                  }
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* ── Featured image ────────────────────────────────── */}
        {post.featured_image_url && (
          <figure className="mb-24 rounded-[2rem] shadow-sm overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full object-cover max-h-[700px]"
              style={{ filter: 'var(--blog-img-filter)' }}
            />
          </figure>
        )}

        {/* ── Content ───────────────────────────────────────── */}
        <div
          className={[
            'prose prose-stone prose-lg md:prose-xl max-w-none',
            'prose-headings:font-serif',
            'prose-p:font-light prose-p:leading-relaxed',
            'prose-blockquote:font-serif prose-blockquote:text-2xl prose-blockquote:font-light',
            '[&_a]:![color:var(--blog-accent)] [&_a]:no-underline hover:[&_a]:underline',
            '[&_blockquote]:![border-left-color:var(--blog-accent)]',
          ].join(' ')}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content ?? '') }}
        />

        {/* ── Tags ──────────────────────────────────────────── */}
        {allTags.length > 0 && (
          <div
            className="flex flex-wrap gap-2 mt-12 pt-10 border-t"
            style={{ borderColor: '#E8E2D5' }}
          >
            {allTags.map((tg) => (
              <Link
                key={tg}
                to={`/?tag=${encodeURIComponent(tg)}`}
                className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full transition-colors duration-300"
                style={{ background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }}
              >
                {tg}
              </Link>
            ))}
          </div>
        )}

        {/* ── Likes ─────────────────────────────────────────── */}
        {likesEnabled && (
          <div className="flex justify-start mt-10 mb-2">
            <LikeButton postId={post.id} collection="zen" initialCount={post.likes_count} />
          </div>
        )}

        {/* ── Related posts ──────────────────────────────────── */}
        {relatedPosts.length > 0 && (
          <div className="mt-40 border-t pt-24" style={{ borderColor: '#E8E2D5' }}>
            <h3
              className="text-center font-serif text-3xl italic mb-16"
              style={{ color: '#2D2B2A' }}
            >
              {t('blog.zen.relatedReads')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-32">
              {relatedPosts.slice(0, 4).map((rp) => (
                <Link
                  key={rp.id}
                  to={`/post/${rp.slug}`}
                  className="group text-center flex flex-col items-center"
                >
                  <div className="w-56 h-56 rounded-full shadow-sm overflow-hidden mb-8">
                    {rp.featured_image_url ? (
                      <img
                        src={rp.featured_image_url}
                        alt={rp.title}
                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: 'var(--blog-accent-soft)' }}
                      />
                    )}
                  </div>
                  {firstTag(rp.tags) && (
                    <span
                      className="text-xs uppercase mb-3 block"
                      style={{ color: 'var(--blog-accent)' }}
                    >
                      {firstTag(rp.tags)}
                    </span>
                  )}
                  <h4
                    className="font-serif text-xl group-hover:text-[var(--blog-accent)] transition-colors duration-500"
                    style={{ color: '#2D2B2A' }}
                  >
                    {rp.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Back button ────────────────────────────────────── */}
        <div
          className="flex justify-center border-t pt-20 pb-32"
          style={{ borderColor: '#E8E2D5' }}
        >
          <Link
            to="/"
            className="group flex flex-col items-center gap-4 transition-colors duration-300"
            style={{ color: '#8A857E' }}
          >
            <div
              className="w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-300 group-hover:border-[var(--blog-accent)] group-hover:text-[var(--blog-accent)]"
              style={{ borderColor: '#E8E2D5' }}
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-0.5 transition-transform duration-300"
              />
            </div>
            <span className="font-sans text-xs uppercase tracking-widest">
              {t('blog.zen.backToJournal')}
            </span>
          </Link>
        </div>

        {/* ── Comments ──────────────────────────────────────── */}
        {commentsEnabled && (
          <div
            className="pb-20 space-y-12 border-t pt-16"
            style={{ borderColor: '#E8E2D5' }}
          >
            <CommentList postId={post.id} />
            <CommentForm postId={post.id} onSubmitted={onCommentSubmitted} recaptchaSiteKey={settings.recaptcha_enabled === '1' ? settings.recaptcha_site_key : undefined} subscribersEnabled={settings.subscribers_enabled === '1'} />
          </div>
        )}

      </article>

      <ZenFooter settings={settings} socialVisible={socialVisible} />
    </div>
  )
}

// ── ZenAboutContent ───────────────────────────────────────────────────────────

interface ZenAboutContentProps {
  settings: Record<string, string>
  user: boolean
  galleryVisible: boolean
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  socialVisible: boolean
  subscriberVisible?: boolean
  downloadPdfVisible?: boolean
}

export function ZenAboutContent({
  settings,
  user,
  galleryVisible,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  socialVisible,
  subscriberVisible = false,
  downloadPdfVisible = false,
}: ZenAboutContentProps) {
  const summary     = settings.profile_summary     || ''
  const description = settings.profile_description || ''

  const gallery        = parseJSON<Array<{ url: string; title: string; description: string }>>(settings.profile_gallery, [])
  const experience     = parseJSON<Array<{ role: string; company: string; period: string; description: string; tags: string[] }>>(settings.profile_experience, [])
  const skills         = parseJSON<Array<{ name: string; skills: string[] }>>(settings.profile_skills, [])
  const education      = parseJSON<Array<{ degree: string; institution: string; period: string }>>(settings.profile_education, [])
  const certifications = parseJSON<Array<{ name: string; url?: string }>>(settings.profile_certifications, [])
  const testimonials   = parseJSON<Array<{ name: string; role: string; text: string; avatar?: string; linkedin?: string }>>(settings.profile_testimonials, [])

  return (
    <div
      className="blog-collection-zen min-h-screen flex flex-col"
      style={{ background: 'var(--blog-bg, #F7F5F0)', color: '#2D2B2A' }}
    >
      {user && <AdminBar />}
      <ZenNav settings={settings} currentPage="about" profileVisible={true} user={user} subscriberVisible={subscriberVisible} />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-20 w-full">

        {/* PDF download button */}
        {downloadPdfVisible && (
          <div className="mb-12 flex justify-end">
            <AboutPdfButton
              styles={{}}
              settings={settings}
              collection="zen"
              experienceVisible={experienceVisible}
              skillsVisible={skillsVisible}
              educationVisible={educationVisible}
              testimonialsVisible={testimonialsVisible}
              galleryVisible={galleryVisible}
              socialVisible={socialVisible}
            />
          </div>
        )}

        {/* ── About hero (shared component) ─────────────────── */}
        <AboutHero settings={settings} />

        {/* ── Bio + social ──────────────────────────────────── */}
        {(summary || description) && (
          <section className="mt-10 mb-8 max-w-2xl">
            <div className="font-sans text-lg font-light space-y-6" style={{ color: '#5A554E' }}>
              {summary && <p>{summary}</p>}
              {description && <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />}
            </div>
            {socialVisible && (
              <div className="flex items-center gap-5 mt-8 pt-8 border-t" style={{ borderColor: '#E8E2D5' }}>
                {Object.entries(SOCIAL_ICON_MAP)
                  .filter(([key]) => settings[key])
                  .map(([key, Icon]) => (
                    <a
                      key={key}
                      href={settings[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors duration-300"
                      style={{ color: '#8A857E' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--blog-accent)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#8A857E')}
                    >
                      <Icon size={20} />
                    </a>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ── Sub-components ────────────────────────────────── */}
        {galleryVisible && gallery.length > 0 && (
          <section className="border-t py-20" style={{ borderColor: '#E8E2D5' }}>
            <AboutGallery data={gallery} />
          </section>
        )}

        {experienceVisible && experience.length > 0 && (
          <section className="border-t py-20" style={{ borderColor: '#E8E2D5' }}>
            <AboutExperience data={experience} />
          </section>
        )}

        {skillsVisible && skills.length > 0 && (
          <section className="border-t py-20" style={{ borderColor: '#E8E2D5' }}>
            <AboutSkills data={skills} />
          </section>
        )}

        {educationVisible && (education.length > 0 || certifications.length > 0) && (
          <section className="border-t py-20" style={{ borderColor: '#E8E2D5' }}>
            <AboutEducation education={education} certifications={certifications} />
          </section>
        )}

        {testimonialsVisible && testimonials.length > 0 && (
          <section className="border-t py-20" style={{ borderColor: '#E8E2D5' }}>
            <AboutTestimonials data={testimonials} />
          </section>
        )}

      </main>

      <ZenFooter settings={settings} socialVisible={socialVisible} />
    </div>
  )
}
