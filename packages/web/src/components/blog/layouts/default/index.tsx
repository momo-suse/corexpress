/**
 * Default layout — the standard blog layout for the "default" style collection.
 * Extracted from BlogHomePage, PostPage, and AboutPage.
 * Uses CSS vars (--blog-accent, --blog-radius-card, etc.) for theming.
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'
import AdminBar from '@/components/blog/AdminBar'
import BlogHeader from '@/components/blog/BlogHeader'
import HeroSection from '@/components/blog/HeroSection'
import ProfileSection from '@/components/blog/ProfileSection'
import PostList from '@/components/blog/PostList'
import SocialLinks from '@/components/blog/SocialLinks'
import SearchBar from '@/components/blog/SearchBar'
import TagCloud from '@/components/blog/TagCloud'
import PostDetail from '@/components/blog/PostDetail'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AboutHero from '@/components/blog/AboutHero'
import AboutGallery from '@/components/blog/AboutGallery'
import AboutExperience from '@/components/blog/AboutExperience'
import AboutSkills from '@/components/blog/AboutSkills'
import AboutEducation from '@/components/blog/AboutEducation'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import AboutPdfButton from '@/components/blog/AboutPdfButton'
import type { Post, TagItem } from '@/types/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function formatDate(dateStr: string, locale: string): string {
  const localeMap: Record<string, string> = { en: 'en-US', es: 'es-MX', ja: 'ja-JP' }
  return new Date(dateStr).toLocaleDateString(localeMap[locale] ?? locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try {
    return JSON.parse(value ?? '[]') as T
  } catch {
    return fallback
  }
}

// ── Social icon map ───────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, typeof Linkedin> = {
  social_linkedin: Linkedin,
  social_instagram: Instagram,
  social_youtube: Youtube,
  social_facebook: Facebook,
}

// ── DefaultBlogHome ───────────────────────────────────────────────────────────

export interface DefaultBlogHomeProps {
  settings: Record<string, string>
  user: boolean
  heroVisible: boolean
  postListVisible: boolean
  profileVisible: boolean
  socialVisible: boolean
  searchVisible: boolean
  tagCloudVisible: boolean
  getStyles: (name: string) => Record<string, string>
  searchQuery: string
  onSearch: (query: string) => void
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
}

export function DefaultBlogHome({
  settings,
  user,
  heroVisible,
  postListVisible,
  profileVisible,
  socialVisible,
  searchVisible,
  tagCloudVisible,
  getStyles,
  searchQuery,
  onSearch,
  tags,
  activeTag,
  onTagSelect,
}: DefaultBlogHomeProps) {
  const { t } = useTranslation()
  const activeCollection = settings.active_style_collection ?? 'default'
  const blogName = settings.blog_name || 'Blog'
  const hasSidebar = profileVisible || socialVisible || searchVisible || tagCloudVisible

  const socialNetworks = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Admin bar — only shown to authenticated users */}
      {user && <AdminBar />}

      {/* Sticky top bar with blog name + language switcher */}
      <BlogHeader settings={settings} adminBarVisible={user} />

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${user ? 'mt-9' : ''}`}>
        {/* Hero */}
        {heroVisible && (
          <HeroSection styles={getStyles('hero')} settings={settings} />
        )}

        {/* Main content + optional sidebar */}
        <div className={`grid grid-cols-1 gap-10 lg:gap-12 ${hasSidebar ? 'lg:grid-cols-12' : ''}`}>
          {/* Post list column */}
          {postListVisible && (
            <div className={hasSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              <PostList styles={getStyles('post-list')} settings={settings} searchQuery={searchQuery} activeTag={activeTag} />
            </div>
          )}

          {/* Sidebar */}
          {hasSidebar && (
            <aside className="lg:col-span-4">
              <div className="sticky top-20 space-y-8">
                {profileVisible && (
                  <ProfileSection styles={getStyles('profile')} settings={settings} />
                )}
                {(searchVisible || (tagCloudVisible && tags.length > 0)) && (
                  <div
                    className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
                    style={{ borderRadius: 'var(--blog-radius-card)' }}
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
                      {t('blog.tags.explore')}
                    </h3>
                    {searchVisible && (
                      <div className={tagCloudVisible && tags.length > 0 ? 'mb-5' : ''}>
                        <SearchBar variant="editorial" styles={getStyles('search')} onSearch={onSearch} initialQuery={searchQuery} />
                      </div>
                    )}
                    {tagCloudVisible && tags.length > 0 && (
                      <TagCloud bare tags={tags} activeTag={activeTag} onTagSelect={onTagSelect} styles={getStyles('tag-cloud')} />
                    )}
                  </div>
                )}
                {socialVisible && (
                  <SocialLinks styles={getStyles('social-links')} settings={settings} />
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              {settings.blog_logo_url ? (
                <img src={settings.blog_logo_url} alt={blogName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <BookOpen size={20} style={{ color: 'var(--blog-accent)' }} />
              )}
              <span className="font-bold text-base tracking-tight">{blogName}</span>
            </div>

            {/* Copyright */}
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {blogName}. {t('blog.footer.rights')}
            </p>

            {/* Social icons in footer */}
            {socialNetworks.length > 0 && (
              <div className="flex gap-4">
                {socialNetworks.map(({ key, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors"
                    style={{ ['--hover-color' as string]: 'var(--blog-accent)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--blog-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                    aria-label={key}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── DefaultPostContent ────────────────────────────────────────────────────────

export interface DefaultPostContentProps {
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

export function DefaultPostContent({
  post,
  relatedPosts,
  settings,
  user,
  commentsEnabled,
  profileVisible,
  socialVisible,
  onCommentSubmitted,
  availableLocales = [],
  currentLocale = 'en',
  onLocaleChange,
}: DefaultPostContentProps) {
  const { t, i18n } = useTranslation()
  const activeCollection = settings.active_style_collection ?? 'default'
  const hasSidebar = profileVisible || socialVisible

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Admin bar — only for authenticated users */}
      {user && <AdminBar />}

      {/* Sticky top bar with blog name + language switcher */}
      <BlogHeader settings={settings} adminBarVisible={user} />

      <main className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-10 md:py-14 ${user ? 'mt-9' : ''}`}>
        <div className={`grid grid-cols-1 ${hasSidebar ? 'lg:grid-cols-12' : ''} gap-10 lg:gap-14`}>

          {/* ── Sidebar (left, 4/12) ── */}
          {hasSidebar && (
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-10 space-y-6">

                {/* Profile widget */}
                {profileVisible && (
                  <ProfileSection settings={settings} />
                )}

                {/* Recent posts widget */}
                {relatedPosts.length > 0 && (
                  <div
                    className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
                    style={{ borderRadius: 'var(--blog-radius-card)' }}
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
                      {t('blog.posts.recentPosts')}
                    </h3>
                    <div className="flex flex-col gap-5">
                      {relatedPosts.map((rp) => (
                        <Link
                          key={rp.id}
                          to={`/post/${rp.slug}`}
                          className="flex items-center gap-4 group"
                        >
                          {rp.featured_image_url ? (
                            <img
                              src={rp.featured_image_url}
                              alt={rp.title}
                              className="w-16 h-16 object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity ring-1 ring-gray-100 dark:ring-gray-800"
                              style={{ borderRadius: 'calc(var(--blog-radius-card) * 0.6)', filter: 'var(--blog-img-filter)' }}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 flex-shrink-0 flex items-center justify-center"
                              style={{ borderRadius: 'calc(var(--blog-radius-card) * 0.6)', background: 'var(--blog-accent-soft)' }}
                            >
                              <ArrowRight size={18} style={{ color: 'var(--blog-accent)' }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 transition-colors leading-snug mb-1 group-hover:[color:var(--blog-accent)]"
                            >
                              {rp.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={11} />
                              <span>{readingTime(rp.content || rp.excerpt || '')}</span>
                              <span>·</span>
                              <span>{formatDate(rp.created_at, i18n.language)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links widget */}
                {socialVisible && (
                  <SocialLinks />
                )}

              </div>
            </aside>
          )}

          {/* ── Main article (right, 8/12) ── */}
          <div className={`${hasSidebar ? 'lg:col-span-8' : ''} order-1 lg:order-2`}>
            {/* Article */}
            <div
              className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-8"
              style={{ borderRadius: 'var(--blog-radius-card)' }}
            >
              <PostDetail
                post={post}
                settings={settings}
                availableLocales={availableLocales}
                currentLocale={currentLocale}
                onLocaleChange={onLocaleChange}
              />
            </div>

            {/* Comments — only rendered when enabled */}
            {commentsEnabled && (
              <>
                <div
                  className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4"
                  style={{ borderRadius: 'var(--blog-radius-card)' }}
                >
                  <CommentList postId={post.id} />
                </div>
                <div
                  className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 p-4 md:p-6"
                  style={{ borderRadius: 'var(--blog-radius-card)' }}
                >
                  <CommentForm postId={post.id} onSubmitted={onCommentSubmitted} />
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

// ── DefaultAboutContent ───────────────────────────────────────────────────────

export interface DefaultAboutContentProps {
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

export function DefaultAboutContent({
  settings,
  user,
  galleryVisible,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  socialVisible,
  downloadPdfVisible = false,
}: DefaultAboutContentProps) {
  const { t } = useTranslation()
  const activeCollection = settings.active_style_collection ?? 'default'

  const gallery        = parseJSON<{ url: string; title: string; description: string }[]>(settings.profile_gallery, [])
  const experience     = parseJSON<{ role: string; company: string; period: string; description: string; tags: string[] }[]>(settings.profile_experience, [])
  const skills         = parseJSON<{ name: string; skills: string[] }[]>(settings.profile_skills, [])
  const education      = parseJSON<{ degree: string; institution: string; period: string }[]>(settings.profile_education, [])
  const certifications = parseJSON<{ name: string; url?: string }[]>(settings.profile_certifications, [])
  const testimonials   = parseJSON<{ name: string; role: string; text: string; avatar?: string; linkedin?: string }[]>(settings.profile_testimonials, [])

  const summary     = settings.profile_summary || ''
  const description = settings.profile_description || ''

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {user && <AdminBar />}

      {/* Sticky top bar with blog name + language switcher */}
      <BlogHeader settings={settings} adminBarVisible={user} />

      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${user ? 'mt-9' : ''}`}>

        {/* Download PDF button — top-right, shown when enabled */}
        {downloadPdfVisible && (
          <div className="flex justify-end mb-4">
            <AboutPdfButton
              styles={{}}
              settings={settings}
              collection={activeCollection}
              experienceVisible={experienceVisible}
              skillsVisible={skillsVisible}
              educationVisible={educationVisible}
              testimonialsVisible={testimonialsVisible}
              galleryVisible={galleryVisible}
              socialVisible={socialVisible}
            />
          </div>
        )}

        {/* Hero — always shown */}
        <AboutHero settings={settings} />

        {/* Summary / bio — always shown */}
        {(summary || description) && (
          <section className="mb-12">
            <div className="flex items-center mb-6 mt-2">
              <User className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('blog.about.sectionTitle')}</h2>
              <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
            </div>

            {summary && (
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {summary}
              </p>
            )}

            {description && (
              <div
                className="prose prose-gray dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 [&_a]:[color:var(--blog-accent)]"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </section>
        )}

        {/* Toggleable sub-components */}
        {galleryVisible && <AboutGallery data={gallery} />}
        {experienceVisible && <AboutExperience data={experience} />}
        {skillsVisible && <AboutSkills data={skills} />}
        {educationVisible && <AboutEducation education={education} certifications={certifications} />}
        {testimonialsVisible && <AboutTestimonials data={testimonials} />}

        {/* Social links — reused component */}
        {socialVisible && (
          <div className="mt-10">
            <SocialLinks settings={settings} />
          </div>
        )}

      </main>
    </div>
  )
}
