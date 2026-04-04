import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getAnalyticsSummary } from '@/api/analytics'
import { cn } from '@/lib/utils'

type Tab = 'today' | 'week' | 'month'

function buildTodayBars(today: Record<number, number>) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}`, value: today[h] ?? 0 }))
  const max = Math.max(...hours.map((h) => h.value), 1)
  return { bars: hours, max }
}

function buildDateBars(data: Record<string, number>, days: number) {
  const bars: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    bars.push({ label, value: data[key] ?? 0 })
  }
  const max = Math.max(...bars.map((b) => b.value), 1)
  return { bars, max }
}

interface BarChartProps {
  bars: { label: string; value: number }[]
  max: number
  totalLabel: string
  showAllLabels?: boolean
}

function BarChart({ bars, max, totalLabel, showAllLabels = false }: BarChartProps) {
  const total = bars.reduce((s, b) => s + b.value, 0)
  const step = showAllLabels ? 1 : Math.ceil(bars.length / 8)

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground text-base">{total}</span> {totalLabel}
      </p>
      <div className="flex items-end gap-px h-24 w-full">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="relative flex-1 group"
            style={{ height: '100%' }}
          >
            <div
              className={cn(
                'absolute bottom-0 w-full rounded-sm bg-primary/70 group-hover:bg-primary transition-all duration-150',
                bar.value === 0 && 'bg-muted',
              )}
              style={{ height: `${(bar.value / max) * 100}%`, minHeight: bar.value > 0 ? '2px' : '0' }}
            />
            {bar.value > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] text-popover-foreground shadow-sm whitespace-nowrap z-10">
                {bar.value}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {bars.map((bar, i) => (
          <span key={i} className={cn('flex-1 text-center truncate', !showAllLabels && i % step !== 0 && 'invisible')}>
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPanel() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('week')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
    staleTime: 5 * 60 * 1000,
  })

  const summary = data?.data

  const { bars: todayBars, max: todayMax } = summary
    ? buildTodayBars(summary.today)
    : { bars: [], max: 1 }

  const { bars: weekBars, max: weekMax } = summary
    ? buildDateBars(summary.week, 7)
    : { bars: [], max: 1 }

  const { bars: monthBars, max: monthMax } = summary
    ? buildDateBars(summary.month, 30)
    : { bars: [], max: 1 }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: t('admin.analytics.today') },
    { id: 'week',  label: t('admin.analytics.week') },
    { id: 'month', label: t('admin.analytics.month') },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('admin.analytics.title')}</h2>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="h-24 rounded-md bg-muted/50 animate-pulse" />
      )}

      {!isLoading && summary && (
        <>
          {tab === 'today' && (
            <BarChart
              bars={todayBars}
              max={todayMax}
              totalLabel={t('admin.analytics.views')}
              showAllLabels={false}
            />
          )}
          {tab === 'week' && (
            <BarChart
              bars={weekBars}
              max={weekMax}
              totalLabel={t('admin.analytics.views')}
              showAllLabels={true}
            />
          )}
          {tab === 'month' && (
            <BarChart
              bars={monthBars}
              max={monthMax}
              totalLabel={t('admin.analytics.views')}
              showAllLabels={false}
            />
          )}
        </>
      )}

      {!isLoading && !summary && (
        <p className="text-sm text-muted-foreground text-center py-6">{t('admin.analytics.noData')}</p>
      )}
    </div>
  )
}
