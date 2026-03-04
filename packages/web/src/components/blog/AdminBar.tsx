import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useSettings } from '@/hooks/useSettings'

export default function AdminBar() {
  const user = useAuthStore((s) => s.user)
  const { data } = useSettings()
  const theme = data?.data.blog_theme ?? 'default'

  if (!user) return null

  return (
    <div className={`theme-${theme} fixed top-0 left-0 right-0 z-50 flex h-9 items-center justify-between gap-3 bg-card border-b px-4 text-xs text-foreground`}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 flex items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px] shrink-0">
          C
        </div>
        <span className="font-semibold tracking-wide text-foreground/70">Corexpress</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden sm:block">{user.email}</span>
        <Link
          to="/cx-admin"
          className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Admin
        </Link>
      </div>
    </div>
  )
}
