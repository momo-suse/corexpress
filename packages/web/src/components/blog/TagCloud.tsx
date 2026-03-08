import { useTranslation } from 'react-i18next'
import type { TagItem } from '@/types/api'

interface TagCloudProps {
  tags: TagItem[]
  activeTag: string
  onTagSelect: (tag: string) => void
  styles?: Record<string, string>
  bare?: boolean
}

const Chips = ({ tags, activeTag, onTagSelect }: Pick<TagCloudProps, 'tags' | 'activeTag' | 'onTagSelect'>) => (
  <div className="flex flex-wrap gap-2">
    {tags.map(({ tag }) => {
      const isActive = tag === activeTag
      return (
        <button
          key={tag}
          type="button"
          onClick={() => onTagSelect(isActive ? '' : tag)}
          className="px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-200"
          style={
            isActive
              ? { background: 'var(--blog-accent)', color: '#fff' }
              : { background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }
          }
          aria-pressed={isActive}
        >
          {tag}
        </button>
      )
    })}
  </div>
)

export default function TagCloud({ tags, activeTag, onTagSelect, bare = false }: TagCloudProps) {
  const { t } = useTranslation()
  if (tags.length === 0) return null

  if (bare) return <Chips tags={tags} activeTag={activeTag} onTagSelect={onTagSelect} />

  return (
    <div
      className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 'var(--blog-radius-card)' }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
        {t('blog.tags.title')}
      </h3>
      <Chips tags={tags} activeTag={activeTag} onTagSelect={onTagSelect} />
    </div>
  )
}
