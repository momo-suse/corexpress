import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/api/comments'
import { csrf } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CommentFormProps {
  postId: number
  onSubmitted?: () => void
}

export default function CommentForm({ postId, onSubmitted }: CommentFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await csrf()
      await createComment(postId, { author_name: name, author_email: email, content })
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
  }

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
      <h3 className="text-lg font-bold mb-6">{t('blog.comments.leave')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
