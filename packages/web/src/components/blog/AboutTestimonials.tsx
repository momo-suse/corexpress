import { useState } from 'react'
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { Linkedin } from 'lucide-react'

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

export default function AboutTestimonials({ data }: AboutTestimonialsProps) {
  const [current, setCurrent] = useState(0)

  if (data.length === 0) return null

  const prev = () => setCurrent((i) => (i === 0 ? data.length - 1 : i - 1))
  const next = () => setCurrent((i) => (i === data.length - 1 ? 0 : i + 1))

  const t = data[current]

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 mt-10">
        <MessageSquare className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recomendaciones</h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      <div
        className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[300px] flex flex-col justify-center px-12 md:px-20 py-10"
        style={{ borderRadius: 'var(--blog-radius-card)' }}
      >
        {/* Decorative quote mark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] leading-none font-serif select-none pointer-events-none rotate-180"
          style={{ color: 'var(--blog-accent-soft)', opacity: 0.5 }}
          aria-hidden="true"
        >
          "
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center" key={current}>
          <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed text-base md:text-lg max-w-2xl mb-8">
            "{t.text}"
          </p>

          <div className="flex flex-col items-center gap-3">
            {t.avatar ? (
              <img
                src={t.avatar}
                alt={t.name}
                className="w-14 h-14 rounded-full object-cover border-2 shadow-sm"
                style={{ borderColor: 'var(--blog-accent-soft)' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'var(--blog-accent)' }}
              >
                {t.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                {t.name}
                {t.linkedin && (
                  <a
                    href={t.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#0A66C2] transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={14} />
                  </a>
                )}
              </h4>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--blog-accent)' }}>
                {t.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {data.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 text-gray-400 transition-colors shadow-sm z-20"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 text-gray-400 transition-colors shadow-sm z-20"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--blog-accent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {data.length > 1 && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
            {data.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '2rem' : '0.625rem',
                  background: i === current ? 'var(--blog-accent)' : undefined,
                }}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
