import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usePost, usePosts } from '@/hooks/usePosts'
import { getSettings } from '@/api/settings'
import { useBlogPage } from '@/hooks/useBlogPage'
import PostDetail from '@/components/blog/PostDetail'
import CommentList from '@/components/blog/CommentList'
import CommentForm from '@/components/blog/CommentForm'
import AdminBar from '@/components/blog/AdminBar'
import ProfileSection from '@/components/blog/ProfileSection'
import SocialLinks from '@/components/blog/SocialLinks'
import { ClassicPostContent } from '@/components/blog/ClassicLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import type { PageComponent } from '@/types/api'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function readingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

export default function PostPage() {
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

  // Recent posts for sidebar (max 4, exclude current)
  const { data: recentData } = usePosts(1)

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <p className="text-muted-foreground text-lg">Post no encontrado.</p>
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  const post = data.data
  const settings = (settingsData?.data ?? {}) as unknown as Record<string, string>
  const components: PageComponent[] = pageData?.data.components ?? []
  const activeCollection = settings.active_style_collection ?? 'default'

  const isVisible = (name: string) =>
    components.find((c) => c.name === name)?.is_visible ?? false

  const profileVisible = isVisible('profile')
  const socialVisible = isVisible('social-links')
  const hasSidebar = profileVisible || socialVisible
  const commentsEnabled = (settings.comments_enabled ?? '1') === '1'

  // Recent posts: exclude current, max 4
  const recentPosts = (recentData?.data ?? [])
    .filter((p) => p.slug !== slug)
    .slice(0, 4)

  function handleCommentSubmitted() {
    qc.invalidateQueries({ queryKey: ['comments'] })
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

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Admin bar — only for authenticated users */}
      {user && <AdminBar />}

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
                {recentPosts.length > 0 && (
                  <div
                    className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
                    style={{ borderRadius: 'var(--blog-radius-card)' }}
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
                      Últimos artículos
                    </h3>
                    <div className="flex flex-col gap-5">
                      {recentPosts.map((rp) => (
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
                              <span>{formatDate(rp.created_at)}</span>
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
              <PostDetail post={post} settings={settings} />
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
                  <CommentForm postId={post.id} onSubmitted={handleCommentSubmitted} />
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
