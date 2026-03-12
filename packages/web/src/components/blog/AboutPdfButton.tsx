import { useState } from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface AboutPdfButtonProps {
  styles: Record<string, string>
  settings: Record<string, string>
  collection: string
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  galleryVisible: boolean
  socialVisible: boolean
}

// Per-collection className variants — typography + effects.
// Colors always come from CSS vars (--blog-accent) so they adapt automatically.
function collectionClass(collection: string): string {
  switch (collection) {
    case 'classic':
      return 'font-serif tracking-wide text-xs uppercase hover:bg-[var(--blog-accent-soft)]'
    case 'nebula':
      return 'font-mono text-xs tracking-widest hover:bg-cyan-400/10 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]'
    default:
      return 'font-medium text-sm hover:bg-[var(--blog-accent-soft)]'
  }
}

export default function AboutPdfButton({
  styles,
  settings,
  collection,
  experienceVisible,
  skillsVisible,
  educationVisible,
  testimonialsVisible,
  galleryVisible,
  socialVisible,
}: AboutPdfButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const { downloadAboutPdf } = await import('./AboutPdfDocument')
      await downloadAboutPdf({
        settings,
        collection,
        experienceVisible,
        skillsVisible,
        educationVisible,
        testimonialsVisible,
        galleryVisible,
        socialVisible,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${collectionClass(collection)}`}
      style={{
        color: 'var(--blog-accent)',
        borderColor: 'var(--blog-accent)',
        borderRadius: 'var(--blog-radius-card, 0.5rem)',
        ...styles,
      }}
    >
      <Download size={14} />
      {loading ? t('blog.about.generatingPdf') : t('blog.about.downloadPdf')}
    </button>
  )
}
