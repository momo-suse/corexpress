import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { getStyleCollections } from '@/api/styleCollections'
import { toast } from '@/hooks/useToast'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTranslation } from 'react-i18next'

// ── Mini preview — applies actual CSS vars via blog-collection-* class ─────

function CollectionPreview({ name }: { name: string }) {
  const { t } = useTranslation()
  const isClassic = name === 'classic'
  const isNebula  = name === 'nebula'
  const isZen     = name === 'zen'
  const isSonic   = name === 'sonic'
  const isAtlas   = name === 'atlas'

  if (isZen) {
    return (
      <div
        className="blog-collection-zen pointer-events-none select-none rounded-[2rem] overflow-hidden"
        style={{ background: 'var(--blog-bg, #F7F5F0)', padding: '14px' }}
      >
        {/* Mini two-column hero */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 flex flex-col justify-center gap-2">
            <div className="h-2 w-4/5 rounded-sm bg-current opacity-80" />
            <div className="h-1.5 w-3/5 rounded-sm bg-current opacity-30" />
            <div className="h-3 w-14 rounded-full mt-1" style={{ background: 'var(--blog-accent-soft)' }} />
          </div>
          <div
            className="w-16 aspect-square rounded-[1rem] shrink-0"
            style={{ background: 'var(--blog-accent-soft)' }}
          />
        </div>
        {/* Mini featured card */}
        <div className="rounded-[1rem] overflow-hidden flex bg-white/60">
          <div className="w-[55%] h-10" style={{ background: 'var(--blog-accent-soft)' }} />
          <div className="flex-1 p-2 flex flex-col justify-center gap-1">
            <div className="h-1 w-2/3 rounded-sm opacity-70" style={{ background: 'var(--blog-accent)' }} />
            <div className="h-1.5 w-full rounded-sm bg-current opacity-50" />
          </div>
        </div>
      </div>
    )
  }

  if (isNebula) {
    return (
      <div className="blog-collection-nebula pointer-events-none select-none">
        <div className="rounded-[2rem] overflow-hidden bg-[#030712] border border-white/10">
          {/* Mini pill nav */}
          <div className="px-3 pt-3 pb-2 flex justify-between items-center">
            <div className="h-1.5 w-8 rounded-full bg-white/20" />
            <div className="h-4 w-16 rounded-full bg-white/5 border border-white/10" />
            <div className="flex gap-1">
              <div className="h-1.5 w-3 rounded-full bg-white/20" />
              <div className="h-1.5 w-3 rounded-full bg-white/20" />
            </div>
          </div>
          {/* Mini bento grid */}
          <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
            {/* Featured post (2 cols) */}
            <div className="col-span-2 rounded-xl h-16 bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-slate-800/50" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="h-1.5 w-3/4 rounded bg-white/50 mb-1" />
                <div className="h-1 w-1/2 rounded" style={{ background: 'var(--blog-accent)', opacity: 0.7 }} />
              </div>
            </div>
            {/* Small posts (1 col, stacked) */}
            <div className="col-span-1 flex flex-col gap-1.5">
              <div className="rounded-xl h-[29px] bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="h-1 w-2/3 rounded bg-white/20" />
              </div>
              <div className="rounded-xl h-[29px] bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="h-1 w-1/2 rounded bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isAtlas) {
    return (
      <div
        className="blog-collection-atlas pointer-events-none select-none"
        style={{ background: 'var(--blog-bg, #fafaf9)', padding: '14px' }}
      >
        {/* Mini nav: stone bar with serif brand centered */}
        <div className="flex justify-between items-center mb-3 border-b border-stone-300 pb-2">
          <div className="flex gap-2">
            <div className="h-1 w-8 bg-stone-400 opacity-50" />
            <div className="h-1 w-8 bg-stone-400 opacity-30" />
          </div>
          <div className="h-3 w-12 bg-stone-800 opacity-70" style={{ fontFamily: 'serif' }} />
          <div className="flex gap-1">
            <div className="h-1.5 w-3 rounded-full bg-stone-400 opacity-40" />
            <div className="h-1.5 w-3 rounded-full bg-stone-400 opacity-40" />
          </div>
        </div>
        {/* Mini featured: image 3/5 + text 2/5 */}
        <div className="flex gap-2 mb-3">
          <div className="w-[55%] h-12" style={{ background: 'var(--blog-accent-soft)', filter: 'var(--blog-img-filter)' }} />
          <div className="flex-1 flex flex-col justify-center gap-1 pl-1">
            <div className="h-1 w-1/2 bg-stone-800 opacity-50" />
            <div className="h-2 w-full bg-stone-800 opacity-80" />
            <div className="h-1 w-2/3 bg-stone-500 opacity-40" />
            <div className="h-1.5 w-1/3 mt-1" style={{ background: 'var(--blog-accent)', opacity: 0.7 }} />
          </div>
        </div>
        {/* Mini 3-col grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-8 bg-stone-300 opacity-60" style={{ filter: 'var(--blog-img-filter)' }} />
              <div className="h-1.5 w-2/3 bg-stone-800 opacity-60" />
              <div className="h-1 w-full bg-stone-400 opacity-30" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isSonic) {
    return (
      <div
        className="blog-collection-sonic pointer-events-none select-none overflow-hidden"
        style={{ background: 'var(--blog-bg, #09090b)', padding: '10px' }}
      >
        {/* Mini nav bar */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex gap-2">
            <div className="h-1.5 w-6 bg-zinc-600" />
            <div className="h-1.5 w-6 bg-zinc-700" />
          </div>
          <div className="h-2 w-10 bg-zinc-100 opacity-80" />
          <div className="flex gap-1">
            <div className="h-1.5 w-3 rounded-full bg-zinc-600" />
            <div className="h-1.5 w-3 rounded-full bg-zinc-600" />
          </div>
        </div>
        {/* Featured post with fuchsia shadow offset */}
        <div className="relative mb-3">
          <div className="absolute inset-0 translate-x-1 translate-y-1" style={{ background: 'var(--blog-accent)' }} />
          <div className="relative h-10 bg-zinc-800 border border-zinc-700 flex items-end p-1.5 gap-2">
            <div className="h-1.5 w-1/3 bg-zinc-100 opacity-90" />
            <div className="h-1 w-1/4 opacity-60" style={{ background: 'var(--blog-accent-secondary)' }} />
          </div>
        </div>
        {/* 3-col post grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-zinc-800 border border-zinc-700 p-1.5 flex flex-col gap-1">
              <div className="h-5 bg-zinc-700 mb-1" />
              <div className="h-1 w-2/3 opacity-70" style={{ background: 'var(--blog-accent)' }} />
              <div className="h-1.5 w-full bg-zinc-600 opacity-60" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`blog-collection-${name} pointer-events-none select-none`}>
      {/* Simulated post card */}
      <div
        className="border overflow-hidden bg-white border-gray-200"
        style={{ borderRadius: 'var(--blog-radius-card)' }}
      >
        {/* Image placeholder */}
        <div className="h-24 overflow-hidden" style={{ filter: 'var(--blog-img-filter)' }}>
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        </div>

        {/* Card content */}
        <div className="p-3.5">
          {isClassic ? (
            /* Classic: index row style — date + title + arrow */
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-sans text-gray-400 uppercase tracking-widest shrink-0">
                Mar 2026
              </span>
              <div className="flex-1 h-2 rounded-sm bg-gray-800" />
              <span
                className="text-[10px] font-bold"
                style={{ color: 'var(--blog-accent)' }}
              >
                →
              </span>
            </div>
          ) : (
            /* Default: card style */
            <>
              {/* Tag badge */}
              <span
                className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2.5"
                style={{ background: 'var(--blog-accent-soft)', color: 'var(--blog-accent)' }}
              >
                Diseño
              </span>

              {/* Title lines */}
              <div className="h-2 rounded mb-1.5 w-4/5 bg-gray-800" />
              <div className="h-1.5 rounded mb-1 w-full bg-gray-200" />
              <div className="h-1.5 rounded mb-3 w-2/3 bg-gray-200" />

              {/* Divider */}
              <div className="h-px mb-2.5 bg-gray-100" />

              {/* "Read more" link */}
              <span
                className="text-[10px] font-semibold flex items-center gap-1"
                style={{ color: 'var(--blog-accent)' }}
              >
                {t('blog.posts.readArticle')} →
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StylesPage() {
  const { t } = useTranslation()
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['style-collections'],
    queryFn: getStyleCollections,
  })
  const { mutateAsync, isPending } = useMutateSettings()

  const activeCollection = settingsData?.data.active_style_collection ?? 'default'
  const collections = collectionsData?.data ?? []

  const isLoading = settingsLoading || collectionsLoading

  async function handleSelect(name: string) {
    if (name === activeCollection || isPending) return
    try {
      await mutateAsync({ active_style_collection: name } as never)
      toast({ title: t('admin.styles.updated', { name }) })
    } catch {
      toast({ title: t('admin.styles.updateError'), variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  return (
    <div className="relative min-h-full flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.styles.title')}</h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          {t('admin.styles.subtitle')}
        </p>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="p-8 max-w-5xl mx-auto w-full">

        <p className="text-sm text-muted-foreground mb-8">
          {t('admin.styles.info')}
        </p>

        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('admin.styles.noStyles')}</p>
        ) : (
          <div className={`grid grid-cols-1 gap-5 ${collections.length === 1 ? 'sm:grid-cols-1 max-w-xs' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {collections.map((col) => {
              const isActive = col.name === activeCollection
              const isUpdating = isPending && col.name !== activeCollection

              return (
                <button
                  key={col.id}
                  onClick={() => handleSelect(col.name)}
                  disabled={isPending}
                  className={`group relative flex flex-col text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-primary shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/40 hover:shadow-md'
                  } ${isPending && !isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
                      <Check className="h-2.5 w-2.5" />
                      {t('admin.styles.active')}
                    </div>
                  )}

                  {/* Loading overlay */}
                  {isUpdating && (
                    <div className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}

                  {/* Preview area */}
                  <div className="p-5 pb-4 bg-gray-50 dark:bg-gray-800/30">
                    <CollectionPreview name={col.name} />
                  </div>

                  {/* Info */}
                  <div className="p-5 pt-4 border-t bg-card flex-1">
                    <p className={`text-sm font-bold mb-1.5 capitalize ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {col.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(`admin.styles.descriptions.${col.name}`, { defaultValue: '' })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
