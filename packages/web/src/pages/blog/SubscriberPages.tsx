import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Bell, BellOff, AlertCircle } from 'lucide-react'
import { getSettings } from '@/api/settings'
import { useAuthStore } from '@/store/auth'
import AdminBar from '@/components/blog/AdminBar'
import BlogHeader from '@/components/blog/BlogHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function SubscriberPageShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const settings = settingsData?.data as unknown as Record<string, string> ?? {}
  const activeCollection = settings.active_style_collection ?? 'default'

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {user && <AdminBar />}
      <BlogHeader settings={settings} adminBarVisible={!!user} />
      <main className={`max-w-2xl mx-auto px-4 py-20 ${user ? 'mt-9' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export function SubscriberWelcomePage() {
  const { t } = useTranslation()

  return (
    <SubscriberPageShell>
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">{t('blog.subscribe.welcomeTitle')}</h1>
        <p className="text-muted-foreground">{t('blog.subscribe.welcomeText')}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4 text-primary" />
          <span>{t('blog.subscribe.welcomeNote')}</span>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--blog-accent)', color: '#fff' }}
        >
          {t('blog.subscribe.backToBlog')}
        </Link>
      </div>
    </SubscriberPageShell>
  )
}

export function SubscriberUnsubscribedPage() {
  const { t } = useTranslation()

  return (
    <SubscriberPageShell>
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
          <BellOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t('blog.subscribe.unsubscribedTitle')}</h1>
        <p className="text-muted-foreground">{t('blog.subscribe.unsubscribedText')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
        >
          {t('blog.subscribe.backToBlog')}
        </Link>
      </div>
    </SubscriberPageShell>
  )
}

export function SubscriberErrorPage() {
  const { t } = useTranslation()

  return (
    <SubscriberPageShell>
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">{t('blog.subscribe.errorTitle')}</h1>
        <p className="text-muted-foreground">{t('blog.subscribe.errorText')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
        >
          {t('blog.subscribe.backToBlog')}
        </Link>
      </div>
    </SubscriberPageShell>
  )
}
