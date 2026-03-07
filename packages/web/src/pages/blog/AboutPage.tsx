import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/api/settings'
import { useAboutPage } from '@/hooks/useBlogPage'
import { useAuthStore } from '@/store/auth'
import AdminBar from '@/components/blog/AdminBar'
import AboutHero from '@/components/blog/AboutHero'
import AboutGallery from '@/components/blog/AboutGallery'
import AboutExperience from '@/components/blog/AboutExperience'
import AboutSkills from '@/components/blog/AboutSkills'
import AboutEducation from '@/components/blog/AboutEducation'
import AboutTestimonials from '@/components/blog/AboutTestimonials'
import SocialLinks from '@/components/blog/SocialLinks'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ClassicAboutContent } from '@/components/blog/ClassicLayout'
import { User } from 'lucide-react'
import type { PageComponent } from '@/types/api'

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try {
    return JSON.parse(value ?? '[]') as T
  } catch {
    return fallback
  }
}

export default function AboutPage() {
  const user = useAuthStore((s) => s.user)

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })

  const { data: pageData, isLoading: pageLoading } = useAboutPage()

  if (settingsLoading || pageLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  const settings = (settingsData?.data ?? {}) as unknown as Record<string, string>
  const components: PageComponent[] = pageData?.data.components ?? []
  const activeCollection = settings.active_style_collection ?? 'default'

  // If the about page doesn't exist in DB yet (containers not rebuilt),
  // fall back to showing all sections so data added via Settings is visible.
  const isVisible = (name: string) =>
    components.find((c) => c.name === name)?.is_visible ?? true

  const galleryVisible      = isVisible('about-gallery')
  const experienceVisible   = isVisible('about-experience')
  const skillsVisible       = isVisible('about-skills')
  const educationVisible    = isVisible('about-education')
  const testimonialsVisible = isVisible('about-testimonials')
  const socialVisible       = isVisible('social-links')

  // Classic layout — separate editorial structure
  if (activeCollection === 'classic') {
    return (
      <ClassicAboutContent
        settings={settings}
        user={!!user}
        galleryVisible={galleryVisible}
        experienceVisible={experienceVisible}
        skillsVisible={skillsVisible}
        educationVisible={educationVisible}
        testimonialsVisible={testimonialsVisible}
        socialVisible={socialVisible}
      />
    )
  }

  // Parse JSON data
  const gallery      = parseJSON<{ url: string; title: string; description: string }[]>(settings.profile_gallery, [])
  const experience   = parseJSON<{ role: string; company: string; period: string; description: string; tags: string[] }[]>(settings.profile_experience, [])
  const skills       = parseJSON<{ name: string; skills: string[] }[]>(settings.profile_skills, [])
  const education    = parseJSON<{ degree: string; institution: string; period: string }[]>(settings.profile_education, [])
  const certifications = parseJSON<{ name: string; url?: string }[]>(settings.profile_certifications, [])
  const testimonials = parseJSON<{ name: string; role: string; text: string; avatar?: string; linkedin?: string }[]>(settings.profile_testimonials, [])

  const summary     = settings.profile_summary || ''
  const description = settings.profile_description || ''

  return (
    <div className={`blog-collection-${activeCollection} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {user && <AdminBar />}

      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${user ? 'mt-9' : ''}`}>

        {/* Hero — always shown */}
        <AboutHero settings={settings} />

        {/* Summary / bio — always shown */}
        {(summary || description) && (
          <section className="mb-12">
            <div className="flex items-center mb-6 mt-2">
              <User className="w-5 h-5 mr-3 shrink-0" style={{ color: 'var(--blog-accent)' }} />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Sobre Mí</h2>
              <div className="ml-4 h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
            </div>

            {summary && (
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {summary}
              </p>
            )}

            {description && (
              <div
                className="prose prose-gray dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 [&_a]:[color:var(--blog-accent)]"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </section>
        )}

        {/* Toggleable sub-components */}
        {galleryVisible && <AboutGallery data={gallery} />}
        {experienceVisible && <AboutExperience data={experience} />}
        {skillsVisible && <AboutSkills data={skills} />}
        {educationVisible && <AboutEducation education={education} certifications={certifications} />}
        {testimonialsVisible && <AboutTestimonials data={testimonials} />}

        {/* Social links — reused component */}
        {socialVisible && (
          <div className="mt-10">
            <SocialLinks settings={settings} />
          </div>
        )}

      </main>
    </div>
  )
}
