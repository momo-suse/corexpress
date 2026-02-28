import { useSettings } from '@/hooks/useSettings'
import { applyComponentStyles } from '@/lib/utils'

interface SocialLinksProps {
  styles: Record<string, string>
}

const NETWORKS = [
  { key: 'social_linkedin', label: 'LinkedIn' },
  { key: 'social_instagram', label: 'Instagram' },
  { key: 'social_youtube', label: 'YouTube' },
  { key: 'social_facebook', label: 'Facebook' },
] as const

export default function SocialLinks({ styles }: SocialLinksProps) {
  const { data } = useSettings()
  const settings = data?.data

  if (!settings) return null

  const links = NETWORKS.filter((n) => settings[n.key])
  if (links.length === 0) return null

  return (
    <section className="py-8 px-6 text-center" style={applyComponentStyles(styles)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Find me on</h3>
      <div className="flex justify-center gap-4 flex-wrap">
        {links.map(({ key, label }) => (
          <a
            key={key}
            href={settings[key]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
          >
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
