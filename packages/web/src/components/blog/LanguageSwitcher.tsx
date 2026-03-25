import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Globe } from 'lucide-react'

const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'ja', label: '日本語', short: 'JA' },
] as const

interface LanguageSwitcherProps {
  variant?: 'default' | 'classic' | 'nebula'
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LOCALES.find((l) => l.code === i18n.language?.slice(0, 2)) ?? LOCALES[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(code: string) {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  if (variant === 'nebula') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Language"
          className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 text-slate-300 text-xs font-mono rounded-full px-3 py-1.5 outline-none focus:border-cyan-400/50 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors cursor-pointer"
        >
          <Globe size={11} />
          {current.short}
          <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 mt-1.5 w-32 rounded-xl overflow-hidden border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-xl z-50">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => select(code)}
                className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                  code === current.code
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'classic') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Language"
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {current.short}
          <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-28 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => select(code)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer ${
                  code === current.code
                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // default variant — for BlogHeader (white/blur bar)
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        className="flex items-center gap-1.5 text-xs font-medium bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-2.5 py-1.5 outline-none hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
      >
        <Globe size={12} />
        {current.short}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => select(code)}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                code === current.code
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
