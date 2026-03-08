import { GraduationCap, Award, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EducationItem {
  degree: string
  institution: string
  period: string
}

interface Certification {
  name: string
  url?: string
}

interface AboutEducationProps {
  education: EducationItem[]
  certifications: Certification[]
}

export default function AboutEducation({ education, certifications }: AboutEducationProps) {
  const { t } = useTranslation()
  if (education.length === 0 && certifications.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 mt-10">
        <GraduationCap className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('blog.about.training')}</h2>
        <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        {education.length > 0 && (
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4"
            style={{ borderRadius: 'var(--blog-radius-card)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
              {t('blog.about.education')}
            </h3>
            {education.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ background: 'var(--blog-accent-soft)' }}
                >
                  <GraduationCap size={20} style={{ color: 'var(--blog-accent)' }} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.degree}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                    {item.institution} · {item.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            style={{ borderRadius: 'var(--blog-radius-card)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
              {t('blog.about.certifications')}
            </h3>
            <ul className="space-y-3">
              {certifications.map((cert, idx) => (
                <li key={idx} className="flex items-center gap-3 group">
                  <div
                    className="p-2 rounded-lg shrink-0 transition-colors"
                    style={{ background: 'var(--blog-accent-soft)' }}
                  >
                    <Award size={16} style={{ color: 'var(--blog-accent)' }} />
                  </div>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors group-hover:[color:var(--blog-accent)]"
                    >
                      {cert.name}
                      <ExternalLink size={12} className="opacity-50" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cert.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
