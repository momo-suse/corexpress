import { useState, type KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  styles?: Record<string, string>
  onSearch: (query: string) => void
  initialQuery?: string
  variant?: 'default' | 'editorial'
}

export default function SearchBar({ styles = {}, onSearch, initialQuery = '', variant = 'default' }: SearchBarProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialQuery)

  const isOutline = styles.buttonStyle === 'outline'

  function handleSubmit() {
    onSearch(value.trim())
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  // Editorial variant — inline borderline style for Classic layout sidebar
  if (variant === 'editorial') {
    return (
      <div className="flex items-center gap-2 border-b border-gray-300 dark:border-gray-700 pb-2">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('blog.search.placeholder')}
          className="flex-1 min-w-0 bg-transparent outline-none font-sans text-sm text-gray-600 dark:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-600"
          aria-label={t('blog.search.ariaLabel')}
        />
        <button
          type="button"
          onClick={handleSubmit}
          aria-label={t('blog.search.button')}
          className="shrink-0 text-gray-400 transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 'var(--blog-radius-card)' }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
        {t('blog.search.title')}
      </h3>
      <div
        className="flex w-full overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ borderRadius: 'var(--blog-radius-card)' }}
      >
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('blog.search.placeholder')}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none"
          style={{ color: 'var(--blog-text, #111827)' }}
          aria-label={t('blog.search.ariaLabel')}
        />
        <button
          type="button"
          onClick={handleSubmit}
          aria-label={t('blog.search.button')}
          className="flex items-center px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80 shrink-0"
          style={
            isOutline
              ? {
                  color: 'var(--blog-accent)',
                  background: 'transparent',
                  borderLeft: '1px solid var(--blog-border, #e5e7eb)',
                }
              : {
                  color: '#fff',
                  background: 'var(--blog-accent)',
                }
          }
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
