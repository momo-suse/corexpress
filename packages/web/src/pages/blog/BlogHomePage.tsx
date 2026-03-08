import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useTags } from '@/hooks/useTags'
import { getSettings } from '@/api/settings'
import { useAuthStore } from '@/store/auth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import AdminBar from '@/components/blog/AdminBar'
import HeroSection from '@/components/blog/HeroSection'
import ProfileSection from '@/components/blog/ProfileSection'
import PostList from '@/components/blog/PostList'
import SocialLinks from '@/components/blog/SocialLinks'
import SearchBar from '@/components/blog/SearchBar'
import TagCloud from '@/components/blog/TagCloud'
import { ClassicBlogHome } from '@/components/blog/ClassicLayout'
import { Linkedin, Instagram, Youtube, Facebook, BookOpen } from 'lucide-react'
import type { PageComponent } from '@/types/api'

const SOCIAL_ICONS: Record<string, typeof Linkedin> = {
  social_linkedin: Linkedin,
  social_instagram: Instagram,
  social_youtube: Youtube,
  social_facebook: Facebook,
}

export default function BlogHomePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')

  const { data: settingsData, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })
  const { data: pageData, isLoading: pageLoading, isError: pageError } = useBlogPage()

  // Must be called before any conditional returns (Rules of Hooks)
  const tagsLimit = parseInt((settingsData?.data as Record<string, string> | undefined)?.tags_max_count ?? '6', 10)
  const { data: tagsData } = useTags(tagsLimit)

  if (settingsLoading) return <LoadingSpinner className="min-h-screen" size="lg" />
  if (settingsError) return <Navigate to="/setup" replace />

  if (!settingsData || settingsData.data.setup_complete !== '1') {
    return <Navigate to={user ? '/cx-admin/setup' : '/setup'} replace />
  }

  if (pageLoading) return <LoadingSpinner className="min-h-screen" size="lg" />
  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('blog.errorLoading')}</p>
      </div>
    )
  }

  const settings = settingsData.data as unknown as Record<string, string>
  const blogName = settings.blog_name || 'Blog'
  const components: PageComponent[] = pageData?.data.components ?? []
  const activeCollection = settings.active_style_collection ?? 'default'
  const tags = tagsData?.data ?? []

  const isVisible = (name: string) =>
    components.find((c) => c.name === name)?.is_visible ?? false

  const getStyles = (name: string): Record<string, string> =>
    (components.find((c) => c.name === name)?.styles ?? {}) as Record<string, string>

  const heroVisible = isVisible('hero')
  const postListVisible = isVisible('post-list')
  const profileVisible = isVisible('profile')
  const socialVisible = isVisible('social-links')
  const searchVisible = isVisible('search')
  const tagCloudVisible = isVisible('tag-cloud')
  const hasSidebar = profileVisible || socialVisible || searchVisible || tagCloudVisible

  // Classic layout — completely different structure
  if (activeCollection === 'classic') {
    return (
      <ClassicBlogHome
        settings={settings}
        user={!!user}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        postListVisible={postListVisible}
        heroVisible={heroVisible}
        searchVisible={searchVisible}
        searchStyles={getStyles('search')}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        tagCloudVisible={tagCloudVisible}
        tags={tags}
        activeTag={activeTag}
        onTagSelect={setActiveTag}
      />
    )
  }

  // Social links for footer
  const socialNetworks = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => settings[key])
    .map(([key, Icon]) => ({ key, href: settings[key], Icon }))

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Admin bar — only shown to authenticated users */}
      {user && <AdminBar />}

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
                        <SearchBar variant="editorial" styles={getStyles('search')} onSearch={setSearchQuery} initialQuery={searchQuery} />
                      </div>
                    )}
                    {tagCloudVisible && tags.length > 0 && (
                      <TagCloud bare tags={tags} activeTag={activeTag} onTagSelect={setActiveTag} styles={getStyles('tag-cloud')} />
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
