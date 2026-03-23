import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function applyComponentStyles(styles: Record<string, string>): React.CSSProperties {
  const cssProps: React.CSSProperties = {}
  // background is managed at layout level via CSS classes; only apply text color here
  if (styles.textColor) cssProps.color = styles.textColor
  return cssProps
}

export function formatTimeAgo(
  dateString: string,
  t: (key: string, opts?: { count: number }) => string,
): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hrs = Math.floor(min / 60)
  const days = Math.floor(hrs / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (sec < 60)     return t('common.time.justNow')
  if (min < 60)     return t('common.time.minutesAgo', { count: min })
  if (hrs < 24)     return t('common.time.hoursAgo',   { count: hrs })
  if (days < 7)     return t('common.time.daysAgo',    { count: days })
  if (weeks <= 3)   return t('common.time.weeksAgo',   { count: weeks })
  if (months < 12)  return t('common.time.monthsAgo',  { count: months })
  return t('common.time.yearsAgo', { count: years })
}
