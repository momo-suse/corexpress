import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SubscriberBadgeProps {
  avatarUrl?: string | null
}

export default function SubscriberBadge({ avatarUrl }: SubscriberBadgeProps) {
  const { t } = useTranslation()

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/80">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt=""
          className="h-4 w-4 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
      {t('blog.comments.subscriberBadge')}
    </span>
  )
}
