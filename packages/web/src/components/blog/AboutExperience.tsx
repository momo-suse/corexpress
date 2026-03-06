import { Briefcase } from 'lucide-react'

interface ExperienceItem {
  role: string
  company: string
  period: string
  description: string
  tags: string[]
}

interface AboutExperienceProps {
  data: ExperienceItem[]
}

export default function AboutExperience({ data }: AboutExperienceProps) {
  if (data.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 mt-10">
        <Briefcase className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Experiencia Profesional</h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300"
            style={{ borderRadius: 'var(--blog-radius-card)' }}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
              <div>
                <h3
                  className="text-lg font-bold text-gray-900 dark:text-white transition-colors group-hover:[color:var(--blog-accent)]"
                >
                  {item.role}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm italic mt-0.5">{item.company}</p>
              </div>
              <span
                className="inline-block text-sm font-semibold px-3 py-1 rounded-full w-fit shrink-0"
                style={{ color: 'var(--blog-accent)', background: 'var(--blog-accent-soft)' }}
              >
                {item.period}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {item.description}
            </p>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
