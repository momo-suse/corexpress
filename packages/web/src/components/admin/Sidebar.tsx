import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, MessageSquare, Settings, LogOut, Sliders, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/api/auth'

const NAV = [
  { to: '/cx-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cx-admin/posts', label: 'Posts', icon: FileText, end: false },
  { to: '/cx-admin/comments', label: 'Comments', icon: MessageSquare, end: false },
  { to: '/cx-admin/setup', label: 'Setup', icon: Sliders, end: false },
  { to: '/cx-admin/settings', label: 'Settings', icon: Settings, end: false },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/cx-admin/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r bg-card shrink-0">
      <div className="flex items-center h-14 px-5 border-b font-semibold text-sm tracking-wide">
        Corexpress
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-1">
        <a
          href="/"
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4 shrink-0" />
          View blog
        </a>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
