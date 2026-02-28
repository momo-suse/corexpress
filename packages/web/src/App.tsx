import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Blog pages
import BlogHomePage from '@/pages/blog/BlogHomePage'
import PostPage from '@/pages/blog/PostPage'

// Admin pages
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import SetupPage from '@/pages/admin/SetupPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import PostsPage from '@/pages/admin/PostsPage'
import CommentsPage from '@/pages/admin/CommentsPage'

// Shared
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import AdminLayout from '@/components/admin/AdminLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public blog */}
          <Route path="/" element={<BlogHomePage />} />
          <Route path="/post/:slug" element={<PostPage />} />

          {/* Admin auth */}
          <Route path="/cx-admin/login" element={<LoginPage />} />

          {/* Protected admin */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cx-admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="setup" element={<SetupPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="comments" element={<CommentsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
