import { useTranslation } from 'react-i18next'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface EducationItem {
  degree: string
  institution: string
  period: string
}

interface EducationEditorProps {
  items: EducationItem[]
  onChange: (items: EducationItem[]) => void
}

function set<K extends keyof EducationItem>(
  items: EducationItem[],
  index: number,
  key: K,
  value: EducationItem[K],
): EducationItem[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

export default function EducationEditor({ items, onChange }: EducationEditorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 rounded-lg border border-border bg-muted/30"
        >
          <Input
            value={item.degree}
            onChange={(e) => onChange(set(items, i, 'degree', e.target.value))}
            placeholder={t('admin.about.education.degreePlaceholder')}
            className="flex-[2]"
          />
          <Input
            value={item.institution}
            onChange={(e) => onChange(set(items, i, 'institution', e.target.value))}
            placeholder={t('admin.about.education.institutionPlaceholder')}
            className="flex-[2]"
          />
          <Input
            value={item.period}
            onChange={(e) => onChange(set(items, i, 'period', e.target.value))}
            placeholder={t('admin.about.education.periodPlaceholder')}
            className="flex-1 min-w-[110px]"
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
        onClick={() => onChange([...items, { degree: '', institution: '', period: '' }])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {t('admin.about.education.add')}
      </Button>
    </div>
  )
}
