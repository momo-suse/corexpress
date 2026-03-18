import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useTags } from '@/hooks/useTags'
import { getSettings } from '@/api/settings'
import { useAuthStore } from '@/store/auth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { DefaultBlogHome } from '@/components/blog/layouts/default'
import { ClassicBlogHome } from '@/components/blog/layouts/classic'
import { NebulaBlogHome } from '@/components/blog/layouts/nebula'
import type { PageComponent } from '@/types/api'

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

  // Nebula layout — dark tech bento-grid
  if (activeCollection === 'nebula') {
    return (
      <NebulaBlogHome
        settings={settings}
        user={!!user}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        postListVisible={postListVisible}
        heroVisible={heroVisible}
        searchVisible={searchVisible}
        tagCloudVisible={tagCloudVisible}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        tags={tags}
        activeTag={activeTag}
        onTagSelect={setActiveTag}
      />
    )
  }

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

  // Default layout
  return (
    <DefaultBlogHome
      settings={settings}
      user={!!user}
      heroVisible={heroVisible}
      postListVisible={postListVisible}
      profileVisible={profileVisible}
      socialVisible={socialVisible}
      searchVisible={searchVisible}
      tagCloudVisible={tagCloudVisible}
      getStyles={getStyles}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      tags={tags}
      activeTag={activeTag}
      onTagSelect={setActiveTag}
    />
  )
}
