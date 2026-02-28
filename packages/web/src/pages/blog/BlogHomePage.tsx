import type { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBlogPage } from '@/hooks/useBlogPage'
import { getSettings } from '@/api/settings'
import { useAuthStore } from '@/store/auth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import AdminBar from '@/components/blog/AdminBar'
import HeroSection from '@/components/blog/HeroSection'
import ProfileSection from '@/components/blog/ProfileSection'
import PostList from '@/components/blog/PostList'
import SocialLinks from '@/components/blog/SocialLinks'
import type { PageComponent } from '@/types/api'

interface ComponentProps {
  styles: Record<string, string>
}

const COMPONENT_MAP: Record<string, FC<ComponentProps>> = {
  hero: HeroSection,
  profile: ProfileSection,
  'post-list': PostList,
  'social-links': SocialLinks,
}

export default function BlogHomePage() {
  const user = useAuthStore((s) => s.user)

  // retry: false so a single API failure immediately signals the installer hasn't run
  const { data: settingsData, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })
  const { data: pageData, isLoading: pageLoading, isError: pageError } = useBlogPage()

  // Wait for settings before deciding what to show
  if (settingsLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  // Settings API failed → installer hasn't been run yet
  if (settingsError) return <Navigate to="/setup" replace />

  // Installer ran but blog initial setup not complete
  if (!settingsData || settingsData.data.setup_complete !== '1') {
    return <Navigate to={user ? '/cx-admin/setup' : '/cx-admin/login'} replace />
  }

  if (pageLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load the blog. Please try again.</p>
      </div>
    )
  }

  const components: PageComponent[] = pageData?.data.components ?? []
  const visible = components
    .filter((c) => c.is_visible)
    .sort((a, b) => a.display_order - b.display_order)

  return (
    <>
      <AdminBar />
      <main>
        {visible.map((c) => {
          const Component = COMPONENT_MAP[c.name]
          return Component ? <Component key={c.id} styles={c.styles} /> : null
        })}
      </main>
    </>
  )
}
