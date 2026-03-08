import { useTranslation } from 'react-i18next'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface CertItem {
  name: string
  url?: string
}

interface CertificationsEditorProps {
  items: CertItem[]
  onChange: (items: CertItem[]) => void
}

function set<K extends keyof CertItem>(
  items: CertItem[],
  index: number,
  key: K,
  value: CertItem[K],
): CertItem[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

export default function CertificationsEditor({ items, onChange }: CertificationsEditorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border border-border bg-muted/30"
        >
          <Input
            value={item.name}
            onChange={(e) => onChange(set(items, i, 'name', e.target.value))}
            placeholder={t('admin.about.certifications.namePlaceholder')}
            className="flex-[3]"
          />
          <Input
            value={item.url ?? ''}
            onChange={(e) => onChange(set(items, i, 'url', e.target.value || undefined))}
            placeholder={t('admin.about.certifications.urlPlaceholder')}
            type="url"
            className="flex-[2]"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
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
        onClick={() => onChange([...items, { name: '' }])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {t('admin.about.certifications.add')}
      </Button>
    </div>
  )
}
