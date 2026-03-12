import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AboutHeroProps {
  settings: Record<string, string>
}

export default function AboutHero({ settings }: AboutHeroProps) {
  const name      = settings.profile_name      || 'About Me'
  const title     = settings.profile_title     || ''
  const imageUrl  = settings.profile_image_url || ''
  const coverUrl  = settings.profile_cover_url || ''

  return (
    <div className="mb-12">
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
        >
          <ArrowLeft size={15} />
          Blog
        </Link>
      </div>

      {/* Cover banner — fully rounded, taller */}
      {coverUrl && (
        <div className="relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-md">
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'var(--blog-img-filter)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Profile card — deeply overlaps the cover */}
      <div
        className={`relative bg-white dark:bg-gray-900 mx-4 md:mx-12 rounded-3xl p-6 md:p-10 shadow-xl border border-gray-200 dark:border-gray-700 ${
          coverUrl ? '-mt-28' : 'mt-0'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">

          {/* Avatar — pops above the card when cover exists */}
          <div className={`relative shrink-0 ${coverUrl ? '-mt-20 md:-mt-24' : ''}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-8 ring-white dark:ring-gray-900 shadow-lg"
              />
            ) : (
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 shadow-lg text-4xl font-bold text-white"
                style={{ background: 'var(--blog-accent)' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + title */}
          <div className="flex-1 mt-2 md:mt-0">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-2">
              {name}
            </h1>
            {title && (
              <p className="text-lg md:text-xl font-medium mb-3" style={{ color: 'var(--blog-accent)' }}>
                {title}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
