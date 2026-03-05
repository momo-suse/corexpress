import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useSettings, useMutateSettings } from '@/hooks/useSettings'
import { getStyleCollections } from '@/api/styleCollections'
import { toast } from '@/hooks/useToast'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

// ── Static descriptions per collection name ───────────────────────────────
const DESCRIPTIONS: Record<string, string> = {
  default:
    'Tarjetas redondeadas, imágenes a color y acento índigo. Diseño moderno y amigable.',
  classic:
    'Layout editorial con sidebar fijo, tipografía serif, imágenes en escala de grises y acento rosa.',
}

// ── Mini preview — applies actual CSS vars via blog-collection-* class ─────

function CollectionPreview({ name }: { name: string }) {
  const isClassic = name === 'classic'

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
                Leer artículo →
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
      toast({ title: `Estilo del blog actualizado a "${name}".` })
    } catch {
      toast({ title: 'Error al actualizar el estilo.', variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  return (
    <div className="relative min-h-full flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Blog Style</h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Selecciona el estilo visual del blog público.
        </p>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="p-8 max-w-5xl mx-auto w-full">

        <p className="text-sm text-muted-foreground mb-8">
          El estilo se aplica al blog que ven tus lectores en{' '}
          <strong className="font-medium text-foreground">/</strong>. El estilo del dashboard no se ve afectado.
        </p>

        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay estilos disponibles.</p>
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
                      Activo
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
                      {DESCRIPTIONS[col.name] ?? ''}
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
