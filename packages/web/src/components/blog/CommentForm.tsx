import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/api/comments'
import { csrf } from '@/api/auth'
import { ApiError } from '@/api/client'
import { applyComponentStyles } from '@/lib/utils'

interface CommentFormProps {
  postId: number
  onSubmitted?: () => void
  styles: Record<string, string>
}

export default function CommentForm({ postId, onSubmitted, styles }: CommentFormProps) {
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
        setError('Failed to submit comment.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="py-6 px-6 max-w-3xl mx-auto" style={applyComponentStyles(styles)}>
        <p className="text-sm text-muted-foreground">
          Your comment has been submitted and is pending approval. Thank you!
        </p>
      </div>
    )
  }

  return (
    <section className="py-8 px-6 max-w-3xl mx-auto" style={applyComponentStyles(styles)}>
      <h3 className="text-lg font-semibold mb-4">Leave a comment</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="comment-name">Name</Label>
            <Input
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-email">Email (not published)</Label>
            <Input
              id="comment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-content">Comment</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            maxLength={2000}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit comment'}
        </Button>
      </form>
    </section>
  )
}
