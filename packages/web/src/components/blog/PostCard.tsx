import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Post } from '@/types/api'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">
            <Link to={`/post/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </CardTitle>
          {post.status === 'draft' && (
            <Badge variant="secondary" className="shrink-0">Draft</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
      </CardHeader>
      {post.excerpt && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
        </CardContent>
      )}
    </Card>
  )
}
