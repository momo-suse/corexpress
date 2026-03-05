import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function applyComponentStyles(styles: Record<string, string>): React.CSSProperties {
  const cssProps: React.CSSProperties = {}
  if (styles.background) cssProps.background = styles.background
  if (styles.textColor) cssProps.color = styles.textColor
  return cssProps
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  // Remove time component to compare exact days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (postDate.getTime() === today.getTime()) {
    // It's from today. Calculate hours ago.
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Hace menos de una hora'
    if (diffHours === 1) return 'Hace 1 hora'
    return `Hace ${diffHours} horas`
  }

  // Older than today: "1 de marzo"
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}
