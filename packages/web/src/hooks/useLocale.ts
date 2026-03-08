import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/api/settings'

/**
 * Syncs the active i18n language with the `app_locale` setting stored in the DB.
 * Call once at the App root — applies globally to all pages.
 *
 * On first visit: i18next checks localStorage('cx_locale') immediately (no flash).
 * Once settings load: language is confirmed/updated and persisted to localStorage.
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    retry: false,
  })

  useEffect(() => {
    const locale = (data?.data as Record<string, string> | undefined)?.app_locale
    if (locale && locale !== i18n.language) {
      i18n.changeLanguage(locale)
      localStorage.setItem('cx_locale', locale)
    }
  }, [data, i18n])
}
