import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ChipInput from './ChipInput'

export interface ExperienceItem {
  role: string
  company: string
  period: string
  description: string
  tags: string[]
}

interface ExperienceEditorProps {
  items: ExperienceItem[]
  onChange: (items: ExperienceItem[]) => void
}

function empty(): ExperienceItem {
  return { role: '', company: '', period: '', description: '', tags: [] }
}

function set<K extends keyof ExperienceItem>(
  items: ExperienceItem[],
  index: number,
  key: K,
  value: ExperienceItem[K],
): ExperienceItem[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

function move(items: ExperienceItem[], from: number, to: number): ExperienceItem[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

export default function ExperienceEditor({ items, onChange }: ExperienceEditorProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium text-foreground truncate">
              {item.role || item.company
                ? `${item.role || '—'}${item.company ? ` @ ${item.company}` : ''}`
                : `Experience ${i + 1}`}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => onChange(move(items, i, i - 1))}
                disabled={i === 0}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(move(items, i, i + 1))}
                disabled={i === items.length - 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role / Position</Label>
                <Input
                  value={item.role}
                  onChange={(e) => onChange(set(items, i, 'role', e.target.value))}
                  placeholder="Lead Frontend Developer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company</Label>
                <Input
                  value={item.company}
                  onChange={(e) => onChange(set(items, i, 'company', e.target.value))}
                  placeholder="Tech Solutions Global"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Period</Label>
              <Input
                value={item.period}
                onChange={(e) => onChange(set(items, i, 'period', e.target.value))}
                placeholder="2020 – Present"
                className="max-w-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={item.description}
                onChange={(e) => onChange(set(items, i, 'description', e.target.value))}
                placeholder="Key achievements and responsibilities…"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Technologies / Tags</Label>
              <ChipInput
                value={item.tags}
                onChange={(tags) => onChange(set(items, i, 'tags', tags))}
                placeholder="React, TypeScript… (Enter or comma to add)"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, empty()])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add experience
      </Button>
    </div>
  )
}
