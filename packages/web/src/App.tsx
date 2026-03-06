import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Blog pages
import BlogHomePage from '@/pages/blog/BlogHomePage'
import PostPage from '@/pages/blog/PostPage'
import AboutPage from '@/pages/blog/AboutPage'

// Admin pages
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import SetupPage from '@/pages/admin/SetupPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import CommentsPage from '@/pages/admin/CommentsPage'
import StylesPage from '@/pages/admin/StylesPage'

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
          <Route path="/about" element={<AboutPage />} />

          {/* Admin auth */}
          <Route path="/cx-admin/login" element={<LoginPage />} />

          {/* Protected admin */}
          <Route element={<ProtectedRoute />}>
            {/* Setup: full-screen, no sidebar */}
            <Route path="/cx-admin/setup" element={<SetupPage />} />

            {/* Admin dashboard with sidebar layout */}
            <Route path="/cx-admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="styles" element={<StylesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
