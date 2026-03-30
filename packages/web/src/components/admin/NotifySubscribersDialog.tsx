import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getSubscribers } from '@/api/subscribers'

interface NotifySubscribersDialogProps {
  open: boolean
  onConfirm: (notify: boolean) => void
}

export default function NotifySubscribersDialog({ open, onConfirm }: NotifySubscribersDialogProps) {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['subscribers', { page: 1 }],
    queryFn: () => getSubscribers({ page: 1 }),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const activeCount = (data?.meta as Record<string, number> | undefined)?.active ?? 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onConfirm(false) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <DialogTitle>{t('admin.dashboard.notifyDialog.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('admin.dashboard.notifyDialog.description', { count: activeCount })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onConfirm(false)} className="sm:order-1">
            {t('admin.dashboard.notifyDialog.skip')}
          </Button>
          <Button onClick={() => onConfirm(true)} disabled={activeCount === 0} className="gap-2 sm:order-2">
            {activeCount === 0 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {t('admin.dashboard.notifyDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
