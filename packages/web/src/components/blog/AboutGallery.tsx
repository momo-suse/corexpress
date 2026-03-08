import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'

interface GalleryImage {
  url: string
  title: string
  description: string
}

interface AboutGalleryProps {
  data: GalleryImage[]
}

export default function AboutGallery({ data }: AboutGalleryProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)

  if (data.length === 0) return null

  const prev = () => setCurrent((i) => (i === 0 ? data.length - 1 : i - 1))
  const next = () => setCurrent((i) => (i === data.length - 1 ? 0 : i + 1))

  const img = data[current]

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 mt-10">
        <ImageIcon className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('blog.about.galleryTitle')}</h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      <div
        className="relative group overflow-hidden h-72 md:h-[420px] border border-gray-200 dark:border-gray-700"
        style={{ borderRadius: 'var(--blog-radius-card)' }}
      >
        {/* Image */}
        <div
          className="absolute inset-0 bg-center bg-cover transition-all duration-500"
          style={{ backgroundImage: `url(${img.url})`, filter: 'var(--blog-img-filter)' }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/30 to-transparent" />

        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-1">{img.title}</h3>
          <p className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-2xl">{img.description}</p>
        </div>

        {/* Prev button */}
        {data.length > 1 && (
          <button
            onClick={prev}
            className="hidden group-hover:flex absolute top-1/2 -translate-y-1/2 left-4 items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white"
            aria-label={t('blog.about.testimonialPrev')}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Next button */}
        {data.length > 1 && (
          <button
            onClick={next}
            className="hidden group-hover:flex absolute top-1/2 -translate-y-1/2 right-4 items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white"
            aria-label={t('blog.about.testimonialNext')}
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Dot indicators */}
        {data.length > 1 && (
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {data.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full bg-white transition-all duration-300 ${
                  i === current ? 'w-7 h-2.5 opacity-100' : 'w-2.5 h-2.5 opacity-50 hover:opacity-90'
                }`}
                aria-label={t('blog.about.galleryImage', { n: i + 1 })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
