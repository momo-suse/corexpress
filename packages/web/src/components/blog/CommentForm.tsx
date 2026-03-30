import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/api/comments'
import { csrf } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSubscriber } from '@/hooks/useSubscriber'
import SubscriberBadge from './SubscriberBadge'
import SubscribeButton from './SubscribeButton'

interface CommentFormProps {
  postId: number
  recaptchaSiteKey?: string
  subscribersEnabled?: boolean
  onSubmitted?: () => void
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  const id = 'recaptcha-v3-script'
  if (document.getElementById(id)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = id
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))
    document.head.appendChild(script)
  })
}

function getRecaptchaToken(siteKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error('reCAPTCHA not loaded'))
      return
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKey, { action: 'comment' })
        .then(resolve)
        .catch(reject)
    })
  })
}

export default function CommentForm({ postId, recaptchaSiteKey, subscribersEnabled = false, onSubmitted }: CommentFormProps) {
  const { t } = useTranslation()
  const { subscriber: rawSubscriber } = useSubscriber()
  const subscriber = subscribersEnabled ? rawSubscriber : null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recaptchaSiteKey || subscriber) return

    loadRecaptchaScript(recaptchaSiteKey).catch(() => {})

    return () => {
      document.getElementById('recaptcha-v3-script')?.remove()

      const badge = document.querySelector('.grecaptcha-badge')
      if (badge?.parentElement) badge.parentElement.remove()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).grecaptcha
    }
  }, [recaptchaSiteKey, subscriber])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let recaptchaToken: string | undefined
      if (recaptchaSiteKey && !subscriber) {
        recaptchaToken = await getRecaptchaToken(recaptchaSiteKey)
      }

      await csrf()
      await createComment(postId, {
        ...(subscriber ? {} : { author_name: name, author_email: email }),
        content,
        recaptcha_token: recaptchaToken,
      })
      setSuccess(true)
      setName('')
      setEmail('')
      setContent('')
      onSubmitted?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t('blog.comments.submitError'))
      }
    } finally {
      setLoading(false)
    }
  }, [postId, name, email, content, recaptchaSiteKey, subscriber, onSubmitted, t])

  if (success) {
    return (
      <div className="py-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
          <Send size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('blog.comments.successTitle')}</h4>
        <p className="text-sm text-muted-foreground">
          {t('blog.comments.successText')}
        </p>
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">{t('blog.comments.leave')}</h3>
        {subscribersEnabled && <SubscribeButton />}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {subscriber ? (
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm">
            {subscriber.avatar_url && (
              <img
                src={subscriber.avatar_url}
                alt={subscriber.name}
                className="h-7 w-7 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="font-medium">{subscriber.name}</span>
            <SubscriberBadge />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-name">{t('blog.comments.name')}</Label>
              <Input
                id="comment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder={t('blog.comments.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-email">{t('blog.comments.email')} <span className="text-xs text-muted-foreground">{t('blog.comments.emailNote')}</span></Label>
              <Input
                id="comment-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
                placeholder={t('blog.comments.emailPlaceholder')}
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="comment-content">{t('blog.comments.content')}</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            maxLength={2000}
            placeholder={t('blog.comments.contentPlaceholder')}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            <Send size={15} />
            {loading ? t('blog.comments.submitting') : t('blog.comments.submit')}
          </Button>
        </div>
      </form>
    </section>
  )
}
