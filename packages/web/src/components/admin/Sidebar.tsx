import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Settings, LogOut, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/api/auth'
import { useComments } from '@/hooks/useComments'

export default function Sidebar() {
  const navigate = useNavigate()
  const { data: pendingData } = useComments({ status: 'pending' })
  const pendingCount = pendingData?.meta.total ?? 0

  async function handleLogout() {
    await logout()
    navigate('/cx-admin/login', { replace: true })
  }

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r bg-card shrink-0">
      <div className="flex items-center gap-2.5 h-14 px-5 border-b">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
          C
        </div>
        <span className="font-semibold text-sm tracking-wide">Corexpress</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <NavLink to="/cx-admin" end className={navLink}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/cx-admin/comments" className={navLink}>
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="flex-1">Comments</span>
          {pendingCount > 0 && (
            <span className="ml-auto min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 text-[10px] font-semibold bg-red-500 text-white rounded-full leading-none">
              {pendingCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/cx-admin/settings" className={navLink}>
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="px-3 pb-4 pt-4 space-y-1 border-t">
        <a
          href="/"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4 shrink-0" />
          View blog
        </a>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
