import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ChipInput from './ChipInput'

export interface SkillGroup {
  name: string
  skills: string[]
}

interface SkillsEditorProps {
  items: SkillGroup[]
  onChange: (items: SkillGroup[]) => void
}

function move(items: SkillGroup[], from: number, to: number): SkillGroup[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

export default function SkillsEditor({ items, onChange }: SkillsEditorProps) {
  return (
    <div className="space-y-3">
      {items.map((group, i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          {/* Group header row */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
            <Input
              value={group.name}
              onChange={(e) =>
                onChange(items.map((g, j) => (j === i ? { ...g, name: e.target.value } : g)))
              }
              placeholder="Group name (e.g. Frontend)"
              className="h-8 text-sm font-medium flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
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
                aria-label="Delete group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Skills chips */}
          <div className="p-3 space-y-1.5">
            <Label className="text-xs">Skills</Label>
            <ChipInput
              value={group.skills}
              onChange={(skills) =>
                onChange(items.map((g, j) => (j === i ? { ...g, skills } : g)))
              }
              placeholder="React, TypeScript… (Enter or comma to add)"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { name: '', skills: [] }])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add group
      </Button>
    </div>
  )
}
