import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import LanguageSwitcher from '@/components/blog/LanguageSwitcher'

interface BlogHeaderProps {
  settings?: Record<string, string>
  adminBarVisible?: boolean
}

/** BlogHeader — sticky bar shown above the hero in the default collection. */
export default function BlogHeader({ settings = {}, adminBarVisible = false }: BlogHeaderProps) {
  const blogName = settings.blog_name || 'Blog'
  const logoUrl = settings.blog_logo_url

  return (
    <header className={`sticky z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 h-14 ${adminBarVisible ? 'top-9' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Blog name / logo */}
        <Link to="/" className="flex items-center gap-2 group">
          {logoUrl ? (
            <img src={logoUrl} alt={blogName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <BookOpen size={18} style={{ color: 'var(--blog-accent)' }} />
          )}
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white transition-colors group-hover:[color:var(--blog-accent)]">
            {blogName}
          </span>
        </Link>

        {/* Language switcher */}
        <LanguageSwitcher variant="default" />
      </div>
    </header>
  )
}
