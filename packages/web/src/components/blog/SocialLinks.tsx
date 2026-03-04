import { useSettings } from '@/hooks/useSettings'
import { Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'

interface SocialLinksProps {
  styles?: Record<string, string>
  settings?: Record<string, string>
}

const NETWORKS = [
  {
    key: 'social_linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    hoverClass: 'hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] dark:hover:text-white',
  },
  {
    key: 'social_instagram',
    label: 'Instagram',
    Icon: Instagram,
    hoverClass: 'hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white',
  },
  {
    key: 'social_youtube',
    label: 'YouTube',
    Icon: Youtube,
    hoverClass: 'hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white',
  },
  {
    key: 'social_facebook',
    label: 'Facebook',
    Icon: Facebook,
    hoverClass: 'hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white',
  },
] as const

export default function SocialLinks(_props: SocialLinksProps) {
  const { data } = useSettings()
  const settings = data?.data

  if (!settings) return null

  const links = NETWORKS.filter((n) => settings[n.key])
  if (links.length === 0) return null

  return (
    <div
      className="bg-white dark:bg-gray-900 p-6 shadow-md border border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 'var(--blog-radius-card)' }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
        Conéctate
      </h3>

      <div className="flex justify-center gap-3 flex-wrap">
        {links.map(({ key, label, Icon, hoverClass }) => (
          <a
            key={key}
            href={settings[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={`p-3.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-all duration-300 shadow-sm ${hoverClass}`}
          >
            <Icon size={20} />
          </a>
        ))}
      </div>
    </div>
  )
}
