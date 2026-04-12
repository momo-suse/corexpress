import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLocale } from '@/hooks/useLocale'

// Blog pages
import BlogHomePage from '@/pages/blog/BlogHomePage'
import PostPage from '@/pages/blog/PostPage'
import AboutPage from '@/pages/blog/AboutPage'
import { SubscriberWelcomePage, SubscriberUnsubscribedPage, SubscriberErrorPage } from '@/pages/blog/SubscriberPages'

// Admin pages
import LoginPage from '@/pages/admin/LoginPage'
import ResetPasswordPage from '@/pages/admin/ResetPasswordPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import SetupPage from '@/pages/admin/SetupPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import CommentsPage from '@/pages/admin/CommentsPage'
import StylesPage from '@/pages/admin/StylesPage'
import BlogPage from '@/pages/admin/BlogPage'
import SubscribersPage from '@/pages/admin/SubscribersPage'
import ResourcesPage from '@/pages/admin/ResourcesPage'

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

function PublicScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isPublicBlogRoute = pathname === '/' || pathname === '/about' || pathname.startsWith('/post/')

    if (isPublicBlogRoute) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [pathname])

  return null
}

function AppInner() {
  useLocale()
  return (
    <BrowserRouter>
      <PublicScrollToTop />
      <Routes>
        {/* Public blog */}
        <Route path="/" element={<BlogHomePage />} />
        <Route path="/post/:slug" element={<PostPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Subscriber OAuth flow pages */}
        <Route path="/subscriber/welcome" element={<SubscriberWelcomePage />} />
        <Route path="/subscriber/unsubscribed" element={<SubscriberUnsubscribedPage />} />
        <Route path="/subscriber/error" element={<SubscriberErrorPage />} />

        {/* Admin auth — public */}
        <Route path="/cx-admin/login" element={<LoginPage />} />
        <Route path="/cx-admin/reset-password" element={<ResetPasswordPage />} />

        {/* Protected admin */}
        <Route element={<ProtectedRoute />}>
          {/* Setup: full-screen, no sidebar */}
          <Route path="/cx-admin/setup" element={<SetupPage />} />

          {/* Admin dashboard with sidebar layout */}
          <Route path="/cx-admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="styles" element={<StylesPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="resources" element={<ResourcesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
