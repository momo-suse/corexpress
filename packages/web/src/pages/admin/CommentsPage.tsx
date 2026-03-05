import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useComments, useMutateComment, useClearSpamComments } from '@/hooks/useComments'
import { toast } from '@/hooks/useToast'
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import type { Comment } from '@/types/api'

const STATUS_LABELS: Record<Comment['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  spam: 'Spam',
}

const STATUS_VARIANT: Record<Comment['status'], 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  spam: 'destructive',
}

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Spam', value: 'spam' },
]

export default function CommentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [page, setPage] = useState(1)
  const queryParams = statusFilter === 'all' ? { page } : { status: statusFilter, page }
  const { data, isLoading } = useComments(queryParams)
  const { update, remove } = useMutateComment()
  const clearSpam = useClearSpamComments()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmSpamOpen, setConfirmSpamOpen] = useState(false)

  async function handleStatus(id: number, status: Comment['status']) {
    try {
      await update.mutateAsync({ id, status })
      toast({ title: `Comment marked as ${status}.` })
    } catch {
      toast({ title: 'Failed to update comment.', variant: 'destructive' })
    }
  }

  function askDelete(id: number) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (deletingId === null) return
    setConfirmOpen(false)
    try {
      await remove.mutateAsync(deletingId)
      toast({ title: 'Comment deleted.' })
    } catch {
      toast({ title: 'Failed to delete comment.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleClearSpam() {
    setConfirmSpamOpen(false)
    try {
      await clearSpam.mutateAsync()
      toast({ title: 'All spam comments deleted.' })
    } catch {
      toast({ title: 'Failed to clear spam.', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Comments</h1>
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {statusFilter === 'spam' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmSpamOpen(true)}
            disabled={clearSpam.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Spam
          </Button>
        )}
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium whitespace-nowrap">{comment.author_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{comment.content}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[comment.status]}>
                      {STATUS_LABELS[comment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {comment.status !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Approve"
                          onClick={() => handleStatus(comment.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {comment.status !== 'spam' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Mark as spam"
                          onClick={() => handleStatus(comment.id, 'spam')}
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => askDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No {statusFilter} comments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm px-2">{page} / {data.meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete comment confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete comment"
        description="This comment will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />

      {/* Empty spam confirmation */}
      <ConfirmDialog
        open={confirmSpamOpen}
        title="Empty spam folder"
        description="All spam comments will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete all spam"
        onConfirm={handleClearSpam}
        onCancel={() => setConfirmSpamOpen(false)}
      />
    </div>
  )
}
