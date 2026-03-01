import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/api/comments'
import { csrf } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Send } from 'lucide-react'

interface CommentFormProps {
  postId: number
  onSubmitted?: () => void
}

export default function CommentForm({ postId, onSubmitted }: CommentFormProps) {
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
        setError('No se pudo enviar el comentario.')
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
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">¡Comentario enviado!</h4>
        <p className="text-sm text-muted-foreground">
          Tu comentario está pendiente de aprobación. ¡Gracias!
        </p>
      </div>
    )
  }

  return (
    <section>
      <h3 className="text-lg font-bold mb-6">Dejar un comentario</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="comment-name">Nombre</Label>
            <Input
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-email">Email <span className="text-xs text-muted-foreground">(no se publica)</span></Label>
            <Input
              id="comment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
              placeholder="tu@email.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-content">Comentario</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            maxLength={2000}
            placeholder="Escribe tu comentario aquí…"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            <Send size={15} />
            {loading ? 'Enviando…' : 'Enviar comentario'}
          </Button>
        </div>
      </form>
    </section>
  )
}
