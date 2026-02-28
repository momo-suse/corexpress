import { applyComponentStyles } from '@/lib/utils'
import type { Post } from '@/types/api'

interface PostDetailProps {
  post: Post
  styles: Record<string, string>
}

export default function PostDetail({ post, styles }: PostDetailProps) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <article
      className="py-12 px-6 max-w-3xl mx-auto"
      style={applyComponentStyles(styles)}
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{date}</p>
      </header>
      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
