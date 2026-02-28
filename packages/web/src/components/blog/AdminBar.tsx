import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function AdminBar() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-9 items-center justify-end gap-3 bg-primary px-4 text-primary-foreground text-xs">
      <span className="opacity-70">{user.email}</span>
      <Link
        to="/cx-admin"
        className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity"
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        Admin panel
      </Link>
    </div>
  )
}
