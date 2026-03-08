import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface TestimonialItem {
  name: string
  role: string
  text: string
  avatar?: string
  linkedin?: string
  // internal — not serialized to JSON
  pendingAvatar?: File
  previewAvatar?: string
}

interface TestimonialsEditorProps {
  items: TestimonialItem[]
  onChange: (items: TestimonialItem[]) => void
}

function set<K extends keyof TestimonialItem>(
  items: TestimonialItem[],
  index: number,
  key: K,
  value: TestimonialItem[K],
): TestimonialItem[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

function AvatarCell({
  item,
  index,
  items,
  onChange,
}: {
  item: TestimonialItem
  index: number
  items: TestimonialItem[]
  onChange: (items: TestimonialItem[]) => void
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const src = item.previewAvatar ?? item.avatar

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(
        items.map((it, i) =>
          i === index
            ? { ...it, pendingAvatar: file, previewAvatar: ev.target?.result as string }
            : it,
        ),
      )
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="shrink-0">
      {src ? (
        <div className="relative group">
          <img
            src={src}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover border-2 border-border"
          />
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          aria-label={t('admin.about.testimonials.uploadAvatar')}
        >
          <Upload className="h-4 w-4" />
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

export default function TestimonialsEditor({ items, onChange }: TestimonialsEditorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium text-foreground truncate">
              {item.name || t('admin.about.testimonials.itemTitle', { n: i + 1 })}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
              aria-label={t('admin.about.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <AvatarCell item={item} index={i} items={items} onChange={onChange} />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('admin.about.testimonials.nameLabel')}</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => onChange(set(items, i, 'name', e.target.value))}
                    placeholder={t('admin.about.testimonials.namePlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('admin.about.testimonials.roleLabel')}</Label>
                  <Input
                    value={item.role}
                    onChange={(e) => onChange(set(items, i, 'role', e.target.value))}
                    placeholder={t('admin.about.testimonials.rolePlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('admin.about.testimonials.textLabel')}</Label>
              <Textarea
                rows={3}
                value={item.text}
                onChange={(e) => onChange(set(items, i, 'text', e.target.value))}
                placeholder={t('admin.about.testimonials.textPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('admin.about.testimonials.linkedinLabel')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span></Label>
              <Input
                value={item.linkedin ?? ''}
                onChange={(e) =>
                  onChange(set(items, i, 'linkedin', e.target.value || undefined))
                }
                placeholder={t('admin.about.testimonials.linkedinPlaceholder')}
                type="url"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...items, { name: '', role: '', text: '' }])
        }
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {t('admin.about.testimonials.add')}
      </Button>
    </div>
  )
}
