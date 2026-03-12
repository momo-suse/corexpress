/**
 * AboutPdfDocument — generates a styled PDF of the About page.
 * Loaded dynamically (lazy import) to avoid bundle impact.
 * Uses @react-pdf/renderer (also lazy-loaded on first use).
 */

// NOTE: @react-pdf/renderer is loaded dynamically — no top-level import needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = Record<string, any>

export interface AboutPdfDocumentProps {
  settings: Record<string, string>
  collection: string
  experienceVisible: boolean
  skillsVisible: boolean
  educationVisible: boolean
  testimonialsVisible: boolean
  galleryVisible: boolean
  socialVisible: boolean
}

// ── Theme tokens per collection ────────────────────────────────────────────────

interface PdfTheme {
  bg: string
  text: string
  accent: string
  muted: string
  surface: string
  border: string
  fontFamily: string
}

function getPdfTheme(collection: string): PdfTheme {
  const themes: Record<string, PdfTheme> = {
    nebula: {
      bg: '#030712',
      text: '#e2e8f0',
      accent: '#22d3ee',
      muted: '#94a3b8',
      surface: '#0f172a',
      border: '#1e293b',
      fontFamily: 'Courier',
    },
    classic: {
      bg: '#fafaf8',
      text: '#1a1a1a',
      accent: '#92400e',
      muted: '#525252',
      surface: '#f5f5f3',
      border: '#d4d4aa',
      fontFamily: 'Times-Roman',
    },
    default: {
      bg: '#ffffff',
      text: '#111827',
      accent: '#6366f1',
      muted: '#6b7280',
      surface: '#f9fafb',
      border: '#e5e7eb',
      fontFamily: 'Helvetica',
    },
  }
  return themes[collection] ?? themes.default
}

// ── Strip HTML helper ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── JSON parse helper ──────────────────────────────────────────────────────────

function parseJSON<T>(value: string | undefined, fallback: T): T {
  try {
    return JSON.parse(value ?? '[]') as T
  } catch {
    return fallback
  }
}

// ── PDF Document builder ───────────────────────────────────────────────────────

async function buildDocument(
  { Document, Page, View, Text, Image, StyleSheet, Link }: Awaited<typeof import('@react-pdf/renderer')>,
  props: AboutPdfDocumentProps,
) {
  const {
    settings,
    collection,
    experienceVisible,
    skillsVisible,
    educationVisible,
    testimonialsVisible,
    galleryVisible,
    socialVisible,
  } = props

  const theme = getPdfTheme(collection)

  const name        = settings.profile_name        || ''
  const title       = settings.profile_title       || ''
  const imageUrl    = settings.profile_image_url   || ''
  const summary     = settings.profile_summary     || ''
  const description = stripHtml(settings.profile_description || '')

  const gallery        = parseJSON<{ url: string; title: string }[]>(settings.profile_gallery, [])
  const experience     = parseJSON<{ role: string; company: string; period: string; description: string; tags: string[] }[]>(settings.profile_experience, [])
  const skills         = parseJSON<{ name: string; skills: string[] }[]>(settings.profile_skills, [])
  const education      = parseJSON<{ degree: string; institution: string; period: string }[]>(settings.profile_education, [])
  const certifications = parseJSON<{ name: string; url?: string }[]>(settings.profile_certifications, [])
  const testimonials   = parseJSON<{ name: string; role: string; text: string }[]>(settings.profile_testimonials, [])

  const SOCIAL_KEYS = ['social_linkedin', 'social_instagram', 'social_youtube', 'social_facebook']
  const socialLinks = SOCIAL_KEYS
    .filter((k) => settings[k])
    .map((k) => ({ label: k.replace('social_', ''), url: settings[k] }))

  const s = StyleSheet.create({
    page: {
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: theme.fontFamily,
      padding: 40,
      fontSize: 10,
    } as Style,
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    } as Style,
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
    } as Style,
    name: {
      fontSize: 22,
      fontFamily: theme.fontFamily,
      color: theme.text,
      marginBottom: 2,
    } as Style,
    jobTitle: {
      fontSize: 11,
      color: theme.accent,
      marginBottom: 4,
    } as Style,

    sectionTitle: {
      fontSize: 12,
      fontFamily: theme.fontFamily,
      color: theme.accent,
      marginBottom: 8,
      marginTop: 16,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    } as Style,
    bodyText: {
      fontSize: 10,
      color: theme.text,
      lineHeight: 1.6,
      marginBottom: 6,
    } as Style,
    muted: {
      fontSize: 9,
      color: theme.muted,
      marginBottom: 2,
    } as Style,
    card: {
      backgroundColor: theme.surface,
      padding: 10,
      borderRadius: 6,
      marginBottom: 8,
    } as Style,
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
    } as Style,
    pill: {
      fontSize: 8,
      color: theme.muted,
      backgroundColor: theme.border,
      padding: '2 6',
      borderRadius: 10,
      marginRight: 4,
      marginBottom: 4,
    } as Style,
    imageGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      marginBottom: 8,
    } as Style,
    galleryImage: {
      width: 120,
      height: 80,
    } as Style,
    link: {
      color: theme.accent,
      fontSize: 9,
    } as Style,
  })

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          {imageUrl ? (
            <Image src={imageUrl} style={s.avatar} />
          ) : null}
          <View>
            {name ? <Text style={s.name}>{name}</Text> : null}
            {title ? <Text style={s.jobTitle}>{title}</Text> : null}
          </View>
        </View>

        {/* Bio */}
        {summary ? <Text style={s.bodyText}>{summary}</Text> : null}
        {description ? <Text style={s.bodyText}>{description}</Text> : null}

        {/* Experience */}
        {experienceVisible && experience.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Professional Experience</Text>
            {experience.map((exp, i) => (
              <View key={i} style={s.card}>
                <Text style={{ ...s.bodyText, fontFamily: theme.fontFamily }}>{exp.role}</Text>
                <Text style={s.muted}>{exp.company}{exp.period ? ` · ${exp.period}` : ''}</Text>
                {exp.description ? <Text style={{ ...s.bodyText, marginTop: 4 }}>{exp.description}</Text> : null}
                {exp.tags?.length > 0 && (
                  <View style={{ ...s.row, marginTop: 4 }}>
                    {exp.tags.map((tag) => <Text key={tag} style={s.pill}>{tag}</Text>)}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skillsVisible && skills.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Technical Skills</Text>
            {skills.map((group, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                {group.name ? <Text style={s.muted}>{group.name}</Text> : null}
                <View style={s.row}>
                  {group.skills.map((skill) => <Text key={skill} style={s.pill}>{skill}</Text>)}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educationVisible && (education.length > 0 || certifications.length > 0) && (
          <View>
            <Text style={s.sectionTitle}>Education & Certifications</Text>
            {education.map((edu, i) => (
              <View key={i} style={s.card}>
                <Text style={s.bodyText}>{edu.degree}</Text>
                <Text style={s.muted}>{edu.institution}{edu.period ? ` · ${edu.period}` : ''}</Text>
              </View>
            ))}
            {certifications.map((cert, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                {cert.url ? (
                  <Link src={cert.url} style={s.link}>{cert.name}</Link>
                ) : (
                  <Text style={s.bodyText}>• {cert.name}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Testimonials — max 5 */}
        {testimonialsVisible && testimonials.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Recommendations</Text>
            {testimonials.slice(0, 5).map((item, i) => (
              <View key={i} style={s.card}>
                <Text style={s.bodyText}>"{item.text}"</Text>
                <Text style={s.muted}>{item.name}{item.role ? ` — ${item.role}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Gallery — max 6 images */}
        {galleryVisible && gallery.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Projects Gallery</Text>
            <View style={s.imageGrid}>
              {gallery.slice(0, 6).map((item, i) => (
                <Image key={i} src={item.url} style={s.galleryImage} />
              ))}
            </View>
          </View>
        )}

        {/* Social links */}
        {socialVisible && socialLinks.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Connect</Text>
            <View style={s.row}>
              {socialLinks.map((sl) => (
                <Link key={sl.label} src={sl.url} style={s.link}>
                  {sl.label}
                </Link>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  )
}

// ── Public download function ───────────────────────────────────────────────────

export async function downloadAboutPdf(props: AboutPdfDocumentProps) {
  const renderer = await import('@react-pdf/renderer')
  const doc = await buildDocument(renderer, props)
  const blob = await renderer.pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.settings.profile_name || 'profile'}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
