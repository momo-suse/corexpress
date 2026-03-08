import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

/**
 * Input that manages an array of string chips (tags, skills).
 * Press Enter or comma to add. Backspace on empty input removes the last chip.
 */
export default function ChipInput({ value, onChange, placeholder = 'Add…' }: ChipInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addChip(raw: string) {
    const trimmed = raw.trim().replace(/,$/, '').trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addChip(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function handleBlur() {
    if (input.trim()) addChip(input)
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center min-h-9 px-3 py-1.5 rounded-md border border-input bg-background text-sm cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
        >
          {chip}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(value.filter((c) => c !== chip))
            }}
            className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
            aria-label={`Remove ${chip}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
      />
    </div>
  )
}
