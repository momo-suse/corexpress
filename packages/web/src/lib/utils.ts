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
