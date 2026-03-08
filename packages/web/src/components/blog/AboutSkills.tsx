import { Code } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SkillGroup {
  name: string
  skills: string[]
}

interface AboutSkillsProps {
  data: SkillGroup[]
}

export default function AboutSkills({ data }: AboutSkillsProps) {
  const { t } = useTranslation()
  if (data.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 mt-10">
        <Code className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('blog.about.skills')}</h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((group) => (
          <div
            key={group.name}
            className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800/80 transition-colors"
            style={{ borderRadius: 'var(--blog-radius-card)' }}
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
              {group.name}
            </h4>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-sm font-medium rounded-full border"
                  style={{
                    color: 'var(--blog-accent)',
                    background: 'var(--blog-accent-soft)',
                    borderColor: 'color-mix(in srgb, var(--blog-accent) 20%, transparent)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
