import { applyComponentStyles } from '@/lib/utils'

interface HeroSectionProps {
  styles: Record<string, string>
  settings: Record<string, string>
}

export default function HeroSection({ styles, settings }: HeroSectionProps) {
  const heroText = settings.hero_text || settings.blog_name || 'Welcome to my blog'
  const description = settings.blog_description || ''
  const heroImageUrl = settings.hero_image_url || ''
  const logoUrl = settings.blog_logo_url || ''
  const blogName = settings.blog_name || ''

  return (
    <section
      className="relative py-20 md:py-32 rounded-3xl overflow-hidden mb-16 flex items-center justify-center min-h-[400px] shadow-lg"
      style={applyComponentStyles(styles)}
    >
      {/* Background image */}
      {heroImageUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={heroImageUrl}
            alt="Hero banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Content: logo left, text right */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
        {/* Logo */}
        {logoUrl ? (
          <div className="flex-shrink-0">
            <img
              src={logoUrl}
              alt={blogName}
              className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover shadow-2xl border-4 border-white/10 hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-32 h-32 md:w-44 md:h-44 rounded-full bg-primary flex items-center justify-center shadow-2xl text-primary-foreground text-5xl font-bold border-4 border-white/10">
            {(blogName || 'B').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Text */}
        <div className="text-center md:text-left">
          <h1
            className={`text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-md mb-4 ${heroImageUrl ? 'text-white' : ''}`}
          >
            {heroText}
          </h1>
          {description && (
            <p className={`text-lg md:text-xl leading-relaxed max-w-2xl drop-shadow-sm ${heroImageUrl ? 'text-gray-200' : 'text-muted-foreground'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
