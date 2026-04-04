import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { toggleLike } from '@/api/likes'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: number
  collection: string
  initialCount: number
}

const STORAGE_KEY = (postId: number) => `cx_liked_${postId}`

export default function LikeButton({ postId, collection, initialCount }: LikeButtonProps) {
  const { t } = useTranslation()

  const [liked, setLiked]   = useState(() => localStorage.getItem(STORAGE_KEY(postId)) === '1')
  const [count, setCount]   = useState(initialCount)
  const [pulse, setPulse]   = useState(false)

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const mutation = useMutation({
    mutationFn: () => toggleLike(postId),
    onMutate: () => {
      const next = !liked
      setLiked(next)
      setCount((c) => c + (next ? 1 : -1))
      if (next) setPulse(true)
    },
    onSuccess: ({ data }) => {
      setLiked(data.liked)
      setCount(data.count)
      localStorage.setItem(STORAGE_KEY(postId), data.liked ? '1' : '0')
    },
    onError: () => {
      setLiked((v) => !v)
      setCount((c) => c + (liked ? 1 : -1))
    },
    onSettled: () => {
      setTimeout(() => setPulse(false), 600)
    },
  })

  const label = liked ? t('blog.likes.liked') : t('blog.likes.like')

  if (collection === 'sonic') {
    return (
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label={label}
        className={cn(
          'group flex items-center gap-2 border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all',
          liked
            ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400'
            : 'text-zinc-400 hover:border-fuchsia-500 hover:text-fuchsia-400',
        )}
      >
        <Heart className={cn('h-3.5 w-3.5 transition-transform', pulse && 'scale-125', liked && 'fill-fuchsia-400')} />
        <span>{label}</span>
        {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
      </button>
    )
  }

  if (collection === 'atlas') {
    return (
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label={label}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs transition-all',
          liked
            ? 'border-amber-700 bg-amber-700/10 text-amber-700'
            : 'border-stone-300 text-stone-500 hover:border-amber-700 hover:text-amber-700 dark:border-stone-600 dark:text-stone-400',
        )}
      >
        <Heart className={cn('h-3.5 w-3.5 transition-transform', pulse && 'scale-125', liked && 'fill-amber-700')} />
        <span>{label}</span>
        {count > 0 && <span className="opacity-60">{count}</span>}
      </button>
    )
  }

  if (collection === 'zen') {
    return (
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label={label}
        className={cn(
          'group inline-flex items-center gap-2 text-sm font-serif transition-colors',
          liked ? 'text-[#C4704A]' : 'text-[#9B8B7A] hover:text-[#C4704A]',
        )}
      >
        <Heart className={cn('h-4 w-4 transition-transform', pulse && 'scale-125', liked && 'fill-[#C4704A]')} />
        <span>{label}</span>
        {count > 0 && <span className="ml-0.5 opacity-60 text-xs">({count})</span>}
      </button>
    )
  }

  if (collection === 'nebula') {
    return (
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label={label}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm transition-all',
          liked
            ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.3)]'
            : 'border-white/10 bg-white/5 text-white/50 hover:border-fuchsia-500/40 hover:text-fuchsia-300',
        )}
      >
        <Heart className={cn('h-3.5 w-3.5 transition-transform', pulse && 'scale-125', liked && 'fill-fuchsia-300')} />
        <span>{label}</span>
        {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
      </button>
    )
  }

  if (collection === 'classic') {
    return (
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label={label}
        className={cn(
          'group inline-flex items-center gap-1.5 text-sm transition-colors',
          liked ? 'text-rose-600' : 'text-muted-foreground hover:text-rose-600',
        )}
      >
        <Heart className={cn('h-4 w-4 transition-transform', pulse && 'scale-125', liked && 'fill-rose-600')} />
        <span>{label}</span>
        {count > 0 && <span className="opacity-60">({count})</span>}
      </button>
    )
  }

  // default
  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-label={label}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
        liked
          ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10'
          : 'border-border text-muted-foreground hover:border-rose-400 hover:text-rose-500',
      )}
    >
      <Heart className={cn('h-4 w-4 transition-transform', pulse && 'scale-125', liked && 'fill-rose-500')} />
      <span>{label}</span>
      {count > 0 && <span className="ml-0.5 opacity-60 text-xs">{count}</span>}
    </button>
  )
}
