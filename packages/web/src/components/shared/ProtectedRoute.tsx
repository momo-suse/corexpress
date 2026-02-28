import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/cx-admin/login" replace />
  }

  return <Outlet />
}
