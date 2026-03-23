import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/api/settings'
import { useAboutPage } from '@/hooks/useBlogPage'
import { useBlogMeta } from '@/hooks/useBlogMeta'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { DefaultAboutContent } from '@/components/blog/layouts/default'
import { ClassicAboutContent } from '@/components/blog/layouts/classic'
import { NebulaAboutContent } from '@/components/blog/layouts/nebula'
import type { PageComponent } from '@/types/api'

export default function AboutPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })

  const { data: pageData, isLoading: pageLoading } = useAboutPage()
  useBlogMeta(settingsData?.data as unknown as Record<string, string> | undefined)

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
  const downloadPdfVisible  = isVisible('download-pdf')

  // Nebula layout — dark tech bento-grid
  if (activeCollection === 'nebula') {
    return (
      <NebulaAboutContent
        settings={settings}
        user={!!user}
        galleryVisible={galleryVisible}
        experienceVisible={experienceVisible}
        skillsVisible={skillsVisible}
        educationVisible={educationVisible}
        testimonialsVisible={testimonialsVisible}
        socialVisible={socialVisible}
        downloadPdfVisible={downloadPdfVisible}
      />
    )
  }

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
        downloadPdfVisible={downloadPdfVisible}
      />
    )
  }

  // Default layout
  return (
    <DefaultAboutContent
      settings={settings}
      user={!!user}
      galleryVisible={galleryVisible}
      experienceVisible={experienceVisible}
      skillsVisible={skillsVisible}
      educationVisible={educationVisible}
      testimonialsVisible={testimonialsVisible}
      socialVisible={socialVisible}
      downloadPdfVisible={downloadPdfVisible}
    />
  )
}
