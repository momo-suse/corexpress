import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { usePost, usePosts } from '@/hooks/usePosts'
import { getSettings } from '@/api/settings'
import { useBlogPage } from '@/hooks/useBlogPage'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { DefaultPostContent } from '@/components/blog/layouts/default'
import { ClassicPostContent } from '@/components/blog/layouts/classic'
import { NebulaPostContent } from '@/components/blog/layouts/nebula'
import type { PageComponent } from '@/types/api'

export default function PostPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const { data, isLoading, isError } = usePost(slug ?? '')
  const user = useAuthStore((s) => s.user)

  // Settings + page data for sidebar visibility
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })
  const { data: pageData } = useBlogPage()

  const settings = (settingsData?.data ?? {}) as unknown as Record<string, string>

  // Recent posts for sidebar (max 4, exclude current)
  const { data: recentData } = usePosts(1)

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <p className="text-muted-foreground text-lg">{t('blog.post.notFound')}</p>
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          ← {t('blog.post.back')}
        </Link>
      </div>
    )
  }

  const post = data.data
  const components: PageComponent[] = pageData?.data.components ?? []
  const activeCollection = settings.active_style_collection ?? 'default'

  const isVisible = (name: string) =>
    components.find((c) => c.name === name)?.is_visible ?? false

  const profileVisible = isVisible('profile')
  const socialVisible = isVisible('social-links')
  const commentsEnabled = (settings.comments_enabled ?? '1') === '1'

  // Recent posts: exclude current, max 4
  const recentPosts = (recentData?.data ?? [])
    .filter((p) => p.slug !== slug)
    .slice(0, 4)

  function handleCommentSubmitted() {
    qc.invalidateQueries({ queryKey: ['comments'] })
  }

  // Nebula layout — dark tech bento-grid
  if (activeCollection === 'nebula') {
    return (
      <NebulaPostContent
        post={post}
        relatedPosts={recentPosts}
        settings={settings}
        user={!!user}
        commentsEnabled={commentsEnabled}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        onCommentSubmitted={handleCommentSubmitted}
      />
    )
  }

  // Classic layout — completely different structure
  if (activeCollection === 'classic') {
    return (
      <ClassicPostContent
        post={post}
        relatedPosts={recentPosts}
        settings={settings}
        user={!!user}
        commentsEnabled={commentsEnabled}
        profileVisible={profileVisible}
        socialVisible={socialVisible}
        onCommentSubmitted={handleCommentSubmitted}
      />
    )
  }

  // Default layout
  return (
    <DefaultPostContent
      post={post}
      relatedPosts={recentPosts}
      settings={settings}
      user={!!user}
      commentsEnabled={commentsEnabled}
      profileVisible={profileVisible}
      socialVisible={socialVisible}
      onCommentSubmitted={handleCommentSubmitted}
    />
  )
}
