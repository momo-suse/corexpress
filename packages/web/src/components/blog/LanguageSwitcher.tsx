import { useTranslation } from 'react-i18next'

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
] as const

interface LanguageSwitcherProps {
  variant?: 'default' | 'classic' | 'nebula'
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2) ?? 'en'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    i18n.changeLanguage(e.target.value)
  }

  if (variant === 'nebula') {
    return (
      <select
        value={current}
        onChange={handleChange}
        aria-label="Language"
        className="bg-slate-900/80 border border-white/10 text-slate-300 text-xs font-mono rounded-full px-3 py-1 outline-none focus:border-cyan-400/50 focus:text-cyan-400 transition-colors cursor-pointer appearance-none"
      >
        {LOCALES.map(({ code, label }) => (
          <option key={code} value={code} className="bg-slate-900 text-slate-200">
            {label}
          </option>
        ))}
      </select>
    )
  }

  if (variant === 'classic') {
    return (
      <select
        value={current}
        onChange={handleChange}
        aria-label="Language"
        className="font-sans text-xs font-semibold uppercase tracking-widest bg-transparent border-0 outline-none cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors appearance-none pr-1"
        style={{ color: 'inherit' }}
      >
        {LOCALES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    )
  }

  // default variant — for BlogHeader (white/blur bar)
  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Language"
      className="text-xs font-medium bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-2.5 py-1 outline-none focus:border-gray-400 dark:focus:border-gray-500 cursor-pointer transition-colors appearance-none"
    >
      {LOCALES.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  )
}
