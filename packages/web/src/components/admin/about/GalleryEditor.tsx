import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface GalleryItem {
  url: string
  title: string
  description: string
  // internal — not serialized to JSON
  pendingFile?: File
  previewUrl?: string
}

interface GalleryEditorProps {
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
}

function set<K extends keyof GalleryItem>(
  items: GalleryItem[],
  index: number,
  key: K,
  value: GalleryItem[K],
): GalleryItem[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

function ImageCell({
  item,
  index,
  items,
  onChange,
}: {
  item: GalleryItem
  index: number
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const src = item.previewUrl ?? item.url

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(
        items.map((it, i) =>
          i === index
            ? { ...it, pendingFile: file, previewUrl: ev.target?.result as string }
            : it,
        ),
      )
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="shrink-0">
      {src ? (
        <div className="relative group w-16 h-16">
          <img
            src={src}
            alt={t('admin.about.gallery.imageAlt')}
            className="w-16 h-16 object-cover rounded border border-border"
          />
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 text-white" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
          aria-label={t('admin.about.gallery.uploadImage')}
        >
          <Upload className="h-4 w-4" />
          <span className="text-[10px] leading-none">{t('admin.about.gallery.imageLabel')}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export default function GalleryEditor({ items, onChange }: GalleryEditorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30"
        >
          <ImageCell item={item} index={i} items={items} onChange={onChange} />

          <div className="flex-1 space-y-2 min-w-0">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('admin.about.gallery.titleLabel')}</Label>
              <Input
                value={item.title}
                onChange={(e) => onChange(set(items, i, 'title', e.target.value))}
                placeholder={t('admin.about.gallery.titlePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('admin.about.gallery.descriptionLabel')}</Label>
              <Textarea
                rows={2}
                value={item.description}
                onChange={(e) => onChange(set(items, i, 'description', e.target.value))}
                placeholder={t('admin.about.gallery.descriptionPlaceholder')}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
            aria-label={t('admin.about.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { url: '', title: '', description: '' }])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {t('admin.about.gallery.add')}
      </Button>
    </div>
  )
}
