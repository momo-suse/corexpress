import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Download, FileImage, HardDrive, ImageUp, Images, Search, Trash2, Unplug } from 'lucide-react'
import { getImages, replaceImage, deleteImage } from '@/api/images'
import type { ImageAsset, ImageUsageRecord } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { toast } from '@/hooks/useToast'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUsageRecord(record: ImageUsageRecord, t: (key: string, options?: Record<string, unknown>) => string) {
  const title = record.titles[0] ?? t('admin.resources.unknownTitle')

  if (record.kind === 'setting') {
    return t(`admin.resources.settingKeys.${record.setting_key}`, {
      defaultValue: record.setting_key ?? t('admin.resources.unknownLocation'),
    })
  }

  if (record.kind === 'post_featured') {
    return t('admin.resources.locationFeatured', { title })
  }

  if (record.kind === 'post_content') {
    return t('admin.resources.locationContent', { title })
  }

  return t('admin.resources.locationTranslation', {
    title,
    locale: record.locale?.toUpperCase() ?? '--',
  })
}

function usageLocations(image: ImageAsset, t: (key: string, options?: Record<string, unknown>) => string) {
  return Array.from(new Set(image.usage_records.map((record) => formatUsageRecord(record, t))))
}

export default function ResourcesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [images, setImages] = useState<ImageAsset[]>([])
  const [pendingDelete, setPendingDelete] = useState<ImageAsset | null>(null)
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['images', { page, search }],
    queryFn: () => getImages({ page, perPage: 18, search }),
  })

  useEffect(() => {
    if (!data) return
    setImages((current) => {
      if (page === 1) return data.data
      const existing = new Set(current.map((item) => item.id))
      const next = data.data.filter((item) => !existing.has(item.id))
      return [...current, ...next]
    })
  }, [data, page])

  const replaceMutation = useMutation({
    mutationFn: ({ imageId, file }: { imageId: number; file: File }) => replaceImage(imageId, file),
    onSuccess: () => {
      toast({ title: t('admin.resources.replaced') })
      setImages([])
      setPage(1)
      qc.invalidateQueries({ queryKey: ['images'] })
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : t('admin.resources.replaceFailed'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteImage(imageId),
    onSuccess: () => {
      toast({ title: t('admin.resources.deleted') })
      setPendingDelete(null)
      setImages([])
      setPage(1)
      qc.invalidateQueries({ queryKey: ['images'] })
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : t('admin.resources.deleteFailed'), variant: 'destructive' })
    },
  })

  const meta = data?.meta
  const stats = meta?.resource_stats
  const totalResources = stats?.total_resources ?? meta?.total ?? images.length
  const totalBytes = stats?.total_bytes ?? images.reduce((sum, image) => sum + image.file_size, 0)
  const unusedResources = stats?.unused_resources ?? images.filter((image) => image.usage_count === 0).length
  const hasMore = meta ? meta.current_page < meta.last_page : false
  const deleteLocations = useMemo(
    () => (pendingDelete ? usageLocations(pendingDelete, t) : []),
    [pendingDelete, t],
  )

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setImages([])
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleClearSearch() {
    setSearchInput('')
    setImages([])
    setPage(1)
    setSearch('')
  }

  function openReplaceDialog(imageId: number) {
    fileInputs.current[imageId]?.click()
  }

  function handleReplace(imageId: number, file: File | null) {
    if (!file) return
    replaceMutation.mutate({ imageId, file })
  }

  return (
    <div className="relative min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/95 px-8 py-4 backdrop-blur-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('admin.resources.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.resources.subtitle')}</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('admin.resources.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{t('common.search')}</Button>
              {(search || searchInput) && (
                <Button type="button" variant="outline" onClick={handleClearSearch}>
                  {t('admin.resources.clearSearch')}
                </Button>
              )}
            </div>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <Images className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.resources.totalResources')}</p>
                <p className="text-2xl font-semibold tracking-tight">{totalResources}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.resources.totalStorage')}</p>
                <p className="text-2xl font-semibold tracking-tight">{formatBytes(totalBytes)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <Unplug className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('admin.resources.unusedResources')}</p>
                <p className="text-2xl font-semibold tracking-tight">{unusedResources}</p>
              </div>
            </div>
          </div>
        </section>

        {isLoading && page === 1 ? (
          <LoadingSpinner className="py-20" />
        ) : images.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <p className="text-base font-medium">{search ? t('admin.resources.emptySearch') : t('admin.resources.empty')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('admin.resources.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => {
              const locations = usageLocations(image, t)
              const records = image.usage_titles
              const isBusy = replaceMutation.isPending || deleteMutation.isPending

              return (
                <article key={image.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="relative aspect-[4/3] border-b bg-muted/40">
                    <img src={image.url} alt={image.original_name} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3">
                      <Badge variant={image.usage_count > 0 ? 'default' : 'secondary'}>
                        {t('admin.resources.usageCount', { count: image.usage_count })}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="space-y-1">
                      <p className="line-clamp-1 text-sm font-semibold">{image.original_name}</p>
                      <p className="text-xs text-muted-foreground">/{image.filename}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border bg-background/50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('admin.resources.fileType')}</p>
                        <p className="mt-1 text-sm font-medium">{image.mime_type}</p>
                      </div>
                      <div className="rounded-xl border bg-background/50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('admin.resources.fileSize')}</p>
                        <p className="mt-1 text-sm font-medium">{formatBytes(image.file_size)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background/50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('admin.resources.uploadedAt')}</p>
                      <p className="mt-1 text-sm font-medium">{new Date(image.created_at).toLocaleString()}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                        {t('admin.resources.recordsTitle')}
                      </div>
                      {records.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {records.map((record) => (
                            <span key={record} className="rounded-full border bg-muted px-2.5 py-1 text-xs text-foreground/90">
                              {record}
                            </span>
                          ))}
                        </div>
                      ) : image.usage_count > 0 ? (
                        <p className="text-sm text-muted-foreground">{t('admin.resources.noPostRecords')}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('admin.resources.unused')}</p>
                      )}
                    </div>

                    {locations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{t('admin.resources.locationsTitle')}</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {locations.map((location) => (
                            <li key={location} className="line-clamp-1">{location}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button type="button" variant="outline" className="flex-1" disabled={isBusy} onClick={() => openReplaceDialog(image.id)}>
                        <ImageUp className="mr-2 h-4 w-4" />
                        {replaceMutation.isPending ? t('admin.resources.replacing') : t('admin.resources.replace')}
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <a href={image.url} download={image.filename}>
                          <Download className="mr-2 h-4 w-4" />
                          {t('admin.resources.download')}
                        </a>
                      </Button>
                      <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={isBusy} onClick={() => setPendingDelete(image)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </Button>
                    </div>

                    <input
                      ref={(node) => {
                        fileInputs.current[image.id] = node
                      }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
                      className="hidden"
                      onChange={(event) => {
                        handleReplace(image.id, event.target.files?.[0] ?? null)
                        event.target.value = ''
                      }}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {(hasMore || isFetching) && images.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button type="button" variant="outline" onClick={() => setPage((current) => current + 1)} disabled={!hasMore || isFetching}>
              {isFetching ? t('admin.resources.loadingMore') : t('admin.resources.loadMore')}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('admin.resources.deleteTitle')}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.usage_count
                ? t('admin.resources.deleteDescriptionUsed', { count: pendingDelete.usage_count })
                : t('admin.resources.deleteDescriptionUnused')}
            </DialogDescription>
          </DialogHeader>

          {deleteLocations.length > 0 && (
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-2 text-sm font-medium">{t('admin.resources.impactedAreas')}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {deleteLocations.map((location) => (
                  <li key={location}>{location}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!pendingDelete || deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              {deleteMutation.isPending ? t('admin.resources.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
