
interface ProfileSectionProps {
  styles?: Record<string, string>
  settings: Record<string, string>
}

/** Profile section rendered as a sidebar widget card for the default collection layout. */
export default function ProfileSection({ settings }: ProfileSectionProps) {
  const name = settings.profile_name || 'About me'
  const summary = settings.profile_summary || ''
  const description = settings.profile_description || ''
  const imageUrl = settings.profile_image_url || ''

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700 relative overflow-hidden"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -z-10" />

      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
        Sobre mí
      </h3>

      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="mb-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-md">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h4 className="font-bold text-lg mb-1">{name}</h4>

        {summary && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{summary}</p>
        )}

        {description && (
          <div
            className="text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>
    </div>
  )
}
