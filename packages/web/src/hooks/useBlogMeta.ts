import { useEffect } from 'react'

/**
 * Syncs the browser tab title and favicon with blog settings.
 * Falls back to "Corexpress" and the default favicon when settings are not yet loaded.
 *
 * @param settings  The flat settings object from the /api/v1/settings response.
 * @param pageTitle Optional page-level title (e.g. the post title). When provided
 *                  the tab shows "{pageTitle} | {blogName}".
 */
export function useBlogMeta(
  settings: Record<string, string> | undefined,
  pageTitle?: string,
): void {
  useEffect(() => {
    const blogName = settings?.blog_name
    document.title = pageTitle
      ? `${pageTitle} | ${blogName ?? 'Corexpress'}`
      : (blogName ?? 'Corexpress')

    const faviconUrl = settings?.profile_image_url
    if (faviconUrl) {
      const link = document.getElementById('favicon') as HTMLLinkElement | null
      if (link) link.href = faviconUrl
    }
  }, [settings, pageTitle])
}
