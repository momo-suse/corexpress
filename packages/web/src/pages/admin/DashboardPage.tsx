import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePosts } from '@/hooks/usePosts'
import { useComments } from '@/hooks/useComments'
import { useSettings } from '@/hooks/useSettings'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { FileText, MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const { data: postsData } = usePosts(1)
  const { data: pendingData } = useComments({ status: 'pending' })

  // First-run redirect
  useEffect(() => {
    if (!settingsLoading && settingsData?.data.setup_complete !== '1') {
      navigate('/cx-admin/setup', { replace: true })
    }
  }, [settingsData, settingsLoading, navigate])

  if (settingsLoading) {
    return <LoadingSpinner className="min-h-screen" size="lg" />
  }

  const totalPosts = postsData?.meta.total ?? 0
  const pendingComments = pendingData?.meta.total ?? 0
  const recentPosts = postsData?.data.slice(0, 5) ?? []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPosts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingComments}</p>
          </CardContent>
        </Card>
      </div>

      {recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{post.title}</span>
                  <span className="text-xs text-muted-foreground ml-4 shrink-0">
                    {post.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
