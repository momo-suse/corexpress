import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { Trash2, Bell, BellOff } from 'lucide-react'
import { getSubscribers, deleteSubscriber } from '@/api/subscribers'
import { csrf } from '@/api/auth'
import type { Subscriber } from '@/types/api'

export default function SubscribersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', { page }],
    queryFn: () => getSubscribers({ page }),
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await csrf()
      return deleteSubscriber(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      toast({ title: t('admin.subscribers.deleted') })
    },
    onError: () => {
      toast({ title: t('admin.subscribers.deleteFailed'), variant: 'destructive' })
    },
  })

  function askDelete(id: number) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (deletingId === null) return
    setConfirmOpen(false)
    remove.mutate(deletingId)
    setDeletingId(null)
  }

  const subscribers: Subscriber[] = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1
  const activeCount = (meta as Record<string, number> | undefined)?.active ?? 0

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.subscribers.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('admin.subscribers.activeCount', { count: activeCount })}
          </p>
        </div>
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.subscribers.colName')}</TableHead>
                <TableHead>{t('admin.subscribers.colEmail')}</TableHead>
                <TableHead>{t('admin.subscribers.colStatus')}</TableHead>
                <TableHead>{t('admin.subscribers.colJoined')}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    {t('admin.subscribers.empty')}
                  </TableCell>
                </TableRow>
              )}
              {subscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sub.avatar_url && (
                        <img
                          src={sub.avatar_url}
                          alt={sub.name}
                          className="h-7 w-7 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="font-medium">{sub.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sub.email}</TableCell>
                  <TableCell>
                    <Badge variant={sub.subscribed ? 'default' : 'secondary'} className="gap-1">
                      {sub.subscribed ? (
                        <><Bell className="h-3 w-3" />{t('admin.subscribers.statusActive')}</>
                      ) : (
                        <><BellOff className="h-3 w-3" />{t('admin.subscribers.statusUnsubscribed')}</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => askDelete(sub.id)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('common.previous')}
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('admin.subscribers.deleteTitle')}
        description={t('admin.subscribers.deleteDescription')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
