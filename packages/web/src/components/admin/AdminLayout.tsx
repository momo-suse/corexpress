import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { useSettings } from '@/hooks/useSettings'

const THEME_CLASSES = ['theme-default', 'theme-minimal', 'theme-dark'] as const

export default function AdminLayout() {
  const { data } = useSettings()
  const theme = data?.data.blog_theme ?? 'default'

  // Apply theme to document.body so Radix portals (Select, Dialog) inherit CSS vars
  useEffect(() => {
    document.body.classList.remove(...THEME_CLASSES)
    document.body.classList.add(`theme-${theme}`)
    return () => document.body.classList.remove(...THEME_CLASSES)
  }, [theme])

  return (
    <div className={`theme-${theme} flex min-h-screen bg-background text-foreground`}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
