import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, BellOff, Trash2, X, Loader2, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSubscriber, useUpdateSubscriber, useDeleteSubscriber, useSubscriberLogout } from '@/hooks/useSubscriber'
import { getGoogleOAuthUrl } from '@/api/subscribers'

// ── Google "G" SVG ────────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Account modal ─────────────────────────────────────────────────────────────

type ModalState = 'idle' | 'confirm-delete' | 'deleted'

interface SubscriberModalProps {
  onClose: () => void
  blogName: string
}

function SubscriberModal({ onClose, blogName }: SubscriberModalProps) {
  const { t } = useTranslation()
  const { subscriber } = useSubscriber()
  const updateSub = useUpdateSubscriber()
  const deleteSub = useDeleteSubscriber()
  const logout = useSubscriberLogout()
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [deletedName, setDeletedName] = useState('')

  async function handleToggleNotifications() {
    if (!subscriber) return
    try {
      await updateSub.mutateAsync({ subscribed: !subscriber.subscribed })
    } catch {
      // silent — UI already optimistic via hook
    }
  }

  async function handleLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // silent
    }
    onClose()
  }

  async function handleDeleteConfirm() {
    if (!subscriber) return
    setDeletedName(subscriber.name)
    try {
      await deleteSub.mutateAsync()
      setModalState('deleted')
    } catch {
      setModalState('idle')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && modalState !== 'deleted') onClose() }}
    >
      <div
        className="relative w-full max-w-sm shadow-2xl"
        style={{
          background: 'var(--blog-modal-bg, var(--blog-bg, #ffffff))',
          borderRadius: 'var(--blog-radius-card, 12px)',
          border: '1px solid var(--blog-accent)',
          padding: '1.5rem',
        }}
      >
        {/* Close button — hidden when deleted */}
        {modalState !== 'deleted' && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* ── State: idle ── */}
        {modalState === 'idle' && subscriber && (
          <div className="space-y-4">
            {/* Avatar + identity */}
            <div className="flex items-center gap-3">
              {subscriber.avatar_url ? (
                <img
                  src={subscriber.avatar_url}
                  alt={subscriber.name}
                  className="h-12 w-12 rounded-full object-cover shrink-0 ring-2"
                  style={{ ringColor: 'var(--blog-accent)' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: 'var(--blog-accent-soft, #e8e8f0)', color: 'var(--blog-accent)' }}
                >
                  {subscriber.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{subscriber.name}</p>
                <p className="text-xs opacity-60">{subscriber.email}</p>
              </div>
            </div>

            {/* Notification toggle */}
            <button
              onClick={handleToggleNotifications}
              disabled={updateSub.isPending}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: 'var(--blog-accent-soft, #f0f0f8)' }}
            >
              <span className="font-medium">
                {subscriber.subscribed
                  ? t('blog.subscribe.notificationsOn')
                  : t('blog.subscribe.notificationsOff')}
              </span>
              {updateSub.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
              ) : subscriber.subscribed ? (
                <Bell className="h-4 w-4" style={{ color: 'var(--blog-accent)' }} />
              ) : (
                <BellOff className="h-4 w-4 opacity-40" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              {logout.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              {t('blog.subscribe.logout')}
            </button>

            {/* Delete account */}
            <button
              onClick={() => setModalState('confirm-delete')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('blog.subscribe.deleteAccount')}
            </button>
          </div>
        )}

        {/* ── State: confirm-delete ── */}
        {modalState === 'confirm-delete' && (
          <div className="space-y-4 text-center">
            <p className="text-2xl">⚠️</p>
            <p className="font-semibold text-sm">{t('blog.subscribe.deleteConfirmTitle')}</p>
            <p className="text-xs opacity-60">
              {t('blog.subscribe.deleteConfirmText', { blogName })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModalState('idle')}
                className="flex-1 py-2 rounded-lg text-sm border border-current opacity-60 hover:opacity-100 transition-opacity"
              >
                {t('blog.subscribe.deleteConfirmNo')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSub.isPending}
                className="flex-1 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteSub.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  t('blog.subscribe.deleteConfirmYes')
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── State: deleted ── */}
        {modalState === 'deleted' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-4xl">😢</p>
            <p className="font-semibold">{t('blog.subscribe.deletedTitle')}</p>
            <p className="text-sm opacity-60">{t('blog.subscribe.deletedText')}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--blog-accent)', color: '#fff' }}
            >
              {t('blog.subscribe.deletedBack')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SubscriberSection ─────────────────────────────────────────────────────────

export interface SubscriberSectionProps {
  collection: string
  subscriberVisible: boolean
  settings?: Record<string, string>
}

export default function SubscriberSection({ collection, subscriberVisible, settings = {} }: SubscriberSectionProps) {
  const { t } = useTranslation()
  const { subscriber, isLoading } = useSubscriber()
  const logout = useSubscriberLogout()
  const [modalOpen, setModalOpen] = useState(false)
  const blogName = settings.blog_name || 'Blog'

  if (!subscriberVisible) return null
  if (isLoading) return null

  const handleLogin = () => {
    window.location.href = getGoogleOAuthUrl(window.location.pathname)
  }

  const handleLogout = async () => {
    try { await logout.mutateAsync() } catch { /* silent */ }
  }

  // ── Per-collection wrappers ─────────────────────────────────────────────────

  if (collection === 'classic') {
    return (
      <>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          {subscriber ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left group"
              >
                {subscriber.avatar_url ? (
                  <img src={subscriber.avatar_url} alt={subscriber.name} className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--blog-accent-soft,#f0f0f0)', color: 'var(--blog-accent)' }}>{subscriber.name[0]?.toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}</p>
                  <p className="text-[10px] opacity-50 truncate">{subscriber.email}</p>
                </div>
                {subscriber.subscribed ? <Bell className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--blog-accent)' }} /> : <BellOff className="h-3.5 w-3.5 shrink-0 opacity-30" />}
              </button>
              <button onClick={handleLogout} disabled={logout.isPending} className="p-1 opacity-30 hover:opacity-70 transition-opacity shrink-0" aria-label={t('blog.subscribe.logout')}>
                {logout.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 text-xs font-medium w-full hover:opacity-80 transition-opacity">
              <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
              {t('blog.subscribe.button')}
            </button>
          )}
        </div>
        {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
      </>
    )
  }

  if (collection === 'zen') {
    return (
      <>
        <div className="max-w-4xl mx-auto px-6 py-2">
          <div className="flex justify-end">
            {subscriber ? (
              <div className="inline-flex items-center gap-1">
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors" style={{ borderColor: 'var(--blog-accent)', color: 'var(--blog-accent)' }}>
                  {subscriber.avatar_url && <img src={subscriber.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />}
                  {t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}
                  {subscriber.subscribed ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 opacity-40" />}
                </button>
                <button onClick={handleLogout} disabled={logout.isPending} className="p-1 opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'var(--blog-accent)' }} aria-label={t('blog.subscribe.logout')}>
                  {logout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80" style={{ borderColor: 'var(--blog-accent)', color: 'var(--blog-accent)' }}>
                <GoogleIcon className="h-3.5 w-3.5" />
                {t('blog.subscribe.button')}
              </button>
            )}
          </div>
        </div>
        {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
      </>
    )
  }

  if (collection === 'nebula') {
    return (
      <>
        {subscriber ? (
          <div className="inline-flex items-center gap-1">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'rgb(6,182,212)' }}>
              {subscriber.avatar_url && <img src={subscriber.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />}
              {t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}
              {subscriber.subscribed ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 opacity-40" />}
            </button>
            <button onClick={handleLogout} disabled={logout.isPending} className="p-1 opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'rgb(6,182,212)' }} aria-label={t('blog.subscribe.logout')}>
              {logout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all hover:opacity-80" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: 'rgb(6,182,212)' }}>
            <GoogleIcon className="h-3.5 w-3.5" />
            {t('blog.subscribe.button')}
          </button>
        )}
        {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
      </>
    )
  }

  if (collection === 'sonic') {
    return (
      <>
        <div className="border-b border-zinc-800 bg-zinc-950">
          <div className="max-w-6xl mx-auto px-4 py-2 flex justify-end">
            {subscriber ? (
              <div className="inline-flex items-center gap-2">
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors" style={{ color: 'var(--blog-accent, #d946ef)' }}>
                  {subscriber.avatar_url && <img src={subscriber.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover grayscale" referrerPolicy="no-referrer" />}
                  {t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}
                  {subscriber.subscribed ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 opacity-40" />}
                </button>
                <button onClick={handleLogout} disabled={logout.isPending} className="opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'var(--blog-accent, #d946ef)' }} aria-label={t('blog.subscribe.logout')}>
                  {logout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors hover:opacity-70" style={{ color: 'var(--blog-accent, #d946ef)' }}>
                <GoogleIcon className="h-3.5 w-3.5" />
                {t('blog.subscribe.button')}
              </button>
            )}
          </div>
        </div>
        {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
      </>
    )
  }

  if (collection === 'atlas') {
    return (
      <>
        <div className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
            {subscriber ? (
              <div className="inline-flex items-center gap-2">
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors" style={{ color: 'var(--blog-accent, #b45309)' }}>
                  {subscriber.avatar_url && <img src={subscriber.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />}
                  {t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}
                  {subscriber.subscribed ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 opacity-40" />}
                </button>
                <button onClick={handleLogout} disabled={logout.isPending} className="opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'var(--blog-accent, #b45309)' }} aria-label={t('blog.subscribe.logout')}>
                  {logout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors hover:opacity-70" style={{ color: 'var(--blog-accent, #b45309)' }}>
                <GoogleIcon className="h-3.5 w-3.5" />
                {t('blog.subscribe.button')}
              </button>
            )}
          </div>
        </div>
        {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
      </>
    )
  }

  // ── Default (also used by "default" collection) ─────────────────────────────
  return (
    <>
      <div className="w-full border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex justify-end">
          {subscriber ? (
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              >
                {subscriber.avatar_url ? (
                  <img src={subscriber.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'var(--blog-accent-soft,#ebebf8)', color: 'var(--blog-accent)' }}>{subscriber.name[0]?.toUpperCase()}</div>
                )}
                <span>{t('blog.subscribe.greeting', { name: subscriber.name.split(' ')[0] })}</span>
                {subscriber.subscribed ? (
                  <Bell className="h-3.5 w-3.5" style={{ color: 'var(--blog-accent)' }} />
                ) : (
                  <BellOff className="h-3.5 w-3.5 opacity-40" />
                )}
              </button>
              <button onClick={handleLogout} disabled={logout.isPending} className="p-1 opacity-30 hover:opacity-70 transition-opacity" aria-label={t('blog.subscribe.logout')}>
                {logout.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            >
              <GoogleIcon className="h-4 w-4" />
              {t('blog.subscribe.button')}
            </button>
          )}
        </div>
      </div>
      {modalOpen && createPortal(<SubscriberModal onClose={() => setModalOpen(false)} blogName={blogName} />, document.body)}
    </>
  )
}
