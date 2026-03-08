import { useState } from 'react'
import { MessageSquare, ChevronLeft, ChevronRight, Linkedin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Testimonial {
  name: string
  role: string
  text: string
  avatar?: string
  linkedin?: string
}

interface AboutTestimonialsProps {
  data: Testimonial[]
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div
      className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-6 h-full"
      style={{ borderRadius: 'var(--blog-radius-card)' }}
    >
      {/* Testimonial text with blockquote style */}
      <blockquote className="flex-1 mb-6 relative pl-5 border-l-2" style={{ borderColor: 'var(--blog-accent-soft)' }}>
        <span
          className="absolute -left-1 -top-2 text-5xl font-serif leading-none select-none"
          style={{ color: 'var(--blog-accent-soft)' }}
          aria-hidden="true"
        >
          "
        </span>
        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed text-sm md:text-base text-justify">
          {item.text}
          <span
            className="text-3xl font-serif leading-none select-none align-sub ml-1"
            style={{ color: 'var(--blog-accent-soft)' }}
            aria-hidden="true"
          >
            "
          </span>
        </p>
      </blockquote>

      {/* Author */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <div className="flex items-center gap-3">
          {/* Avatar with fallback initials */}
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.name}
              className="w-16 h-16 rounded-full object-cover border-2 shrink-0"
              style={{ borderColor: 'var(--blog-accent-soft)' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: 'var(--blog-accent)' }}
            >
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name, role and LinkedIn */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
              {item.linkedin && (
                <a
                  href={item.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border border-[#0A66C2]/40 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-colors shrink-0"
                >
                  <Linkedin size={11} />
                  LinkedIn
                </a>
              )}
            </div>
            <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--blog-accent)' }}>
              {item.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AboutTestimonials({ data }: AboutTestimonialsProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  if (data.length === 0) return null

  const totalPages = Math.ceil(data.length / 2)
  const visibleItems = data.slice(page * 2, page * 2 + 2)

  const prevPage = () => setPage(p => Math.max(0, p - 1))
  const nextPage = () => setPage(p => Math.min(totalPages - 1, p + 1))

  return (
    <section className="mb-12">
      {/* Section heading */}
      <div className="flex items-center mb-6 mt-10">
        <MessageSquare className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {t('blog.about.testimonials')}
        </h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      {/* Carousel */}
      <div className="relative px-8">
        {/* Prev arrow */}
        {totalPages > 1 && (
          <button
            onClick={prevPage}
            disabled={page === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-sm text-gray-400 disabled:opacity-30 transition-colors"
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
            aria-label={t('blog.about.testimonialPrev')}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* 2-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {visibleItems.map((item, i) => (
            <TestimonialCard key={page * 2 + i} item={item} />
          ))}
        </div>

        {/* Next arrow */}
        {totalPages > 1 && (
          <button
            onClick={nextPage}
            disabled={page === totalPages - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-sm text-gray-400 disabled:opacity-30 transition-colors"
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
            aria-label={t('blog.about.testimonialNext')}
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Pagination dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="h-2.5 rounded-full transition-all duration-300 bg-gray-300 dark:bg-gray-600"
                style={{
                  width: i === page ? '2rem' : '0.625rem',
                  background: i === page ? 'var(--blog-accent)' : undefined,
                }}
                aria-label={t('blog.about.testimonialItem', { index: i + 1 })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
