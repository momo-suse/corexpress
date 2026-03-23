import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { usePost, usePosts } from '@/hooks/usePosts'
import { getSettings } from '@/api/settings'
import { getPostWithLocale } from '@/api/posts'
import { useBlogPage } from '@/hooks/useBlogPage'
import { useBlogMeta } from '@/hooks/useBlogMeta'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { DefaultPostContent } from '@/components/blog/layouts/default'
import { ClassicPostContent } from '@/components/blog/layouts/classic'
import { NebulaPostContent } from '@/components/blog/layouts/nebula'
import type { PageComponent, Post } from '@/types/api'

export default function PostPage() {
  const { t, i18n } = useTranslation()
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

  // ── Locale state for post translations ──────────────────────────────────────
  const [viewLocale, setViewLocale] = useState<string>(i18n.language?.slice(0, 2) ?? 'en')
  const [localizedPost, setLocalizedPost] = useState<Post | null>(null)
  const basePost = data?.data ?? null

  // When the base post loads, sync the viewLocale with the browser language
  useEffect(() => {
    const lang = i18n.language?.slice(0, 2) ?? 'en'
    setViewLocale(lang)
  }, [i18n.language])

  // Fetch a localized version whenever the locale changes (and differs from base)
  const baseLocale = basePost?.base_locale ?? 'en'
  const availableLocales = basePost?.available_locales ?? []

  const { data: localizedData, isFetching: localeFetching } = useQuery({
    queryKey: ['post', slug, viewLocale],
    queryFn: () => getPostWithLocale(slug ?? '', viewLocale),
    enabled: !!slug && !!basePost && viewLocale !== baseLocale,
    retry: false,
  })

  useEffect(() => {
    if (viewLocale === baseLocale) {
      setLocalizedPost(null)
    } else if (localizedData?.data) {
      setLocalizedPost(localizedData.data)
    }
  }, [localizedData, viewLocale, baseLocale])

  const post = localizedPost ?? basePost

  useBlogMeta(settings, post?.title)

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

  if (!post) return <LoadingSpinner className="min-h-screen" size="lg" />

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

  // Locale props shared across all 3 layouts
  const localeProps = {
    availableLocales,
    currentLocale: localeFetching ? viewLocale : (localizedPost ? viewLocale : baseLocale),
    onLocaleChange: setViewLocale,
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
        {...localeProps}
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
        {...localeProps}
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
      {...localeProps}
    />
  )
}
