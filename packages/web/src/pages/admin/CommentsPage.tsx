import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useComments, useMutateComment, useClearSpamComments } from '@/hooks/useComments'
import { toast } from '@/hooks/useToast'
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import type { Comment } from '@/types/api'

const STATUS_VARIANT: Record<Comment['status'], 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  spam: 'destructive',
}

export default function CommentsPage() {
  const { t } = useTranslation()
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
      toast({ title: t('admin.comments.markedAs', { status }) })
    } catch {
      toast({ title: t('admin.comments.updateFailed'), variant: 'destructive' })
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
      toast({ title: t('admin.comments.deleted') })
    } catch {
      toast({ title: t('admin.comments.deleteFailed'), variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleClearSpam() {
    setConfirmSpamOpen(false)
    try {
      await clearSpam.mutateAsync()
      toast({ title: t('admin.comments.allSpamDeleted') })
    } catch {
      toast({ title: t('admin.comments.clearSpamFailed'), variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{t('admin.comments.title')}</h1>
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {([
              { label: t('admin.comments.tabAll'), value: 'all' },
              { label: t('admin.comments.tabPending'), value: 'pending' },
              { label: t('admin.comments.tabApproved'), value: 'approved' },
              { label: t('admin.comments.tabSpam'), value: 'spam' },
            ]).map((tab) => (
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
            {t('admin.comments.emptySpam')}
          </Button>
        )}
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.comments.colAuthor')}</TableHead>
                <TableHead>{t('admin.comments.colComment')}</TableHead>
                <TableHead>{t('admin.comments.colStatus')}</TableHead>
                <TableHead>{t('admin.comments.colDate')}</TableHead>
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
                      {t(`admin.comments.status${comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}`)}
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
                          title={t('admin.comments.approve')}
                          onClick={() => handleStatus(comment.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {comment.status !== 'spam' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('admin.comments.markAsSpam')}
                          onClick={() => handleStatus(comment.id, 'spam')}
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title={t('admin.comments.delete')}
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
                    {t('admin.comments.noComments', { status: statusFilter })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.previous')}
              </Button>
              <span className="flex items-center text-sm px-2">{page} / {data.meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete comment confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title={t('admin.comments.deleteTitle')}
        description={t('admin.comments.deleteDescription')}
        confirmLabel={t('admin.comments.deleteLabel')}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />

      {/* Empty spam confirmation */}
      <ConfirmDialog
        open={confirmSpamOpen}
        title={t('admin.comments.emptySpamTitle')}
        description={t('admin.comments.emptySpamDescription')}
        confirmLabel={t('admin.comments.deleteAllSpam')}
        onConfirm={handleClearSpam}
        onCancel={() => setConfirmSpamOpen(false)}
      />
    </div>
  )
}
