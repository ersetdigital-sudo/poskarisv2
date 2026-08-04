'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCountUp } from './useCountUp'
import { isGoodDelta } from '@/lib/trend'

const TONES = {
  emerald: { tile: 'bg-badge-success/15 text-badge-success', bar: 'from-badge-success' },
  sky: { tile: 'bg-badge-info/15 text-badge-info', bar: 'from-badge-info' },
  orange: { tile: 'bg-badge-warning/15 text-badge-warning', bar: 'from-badge-warning' },
  danger: { tile: 'bg-danger/15 text-danger', bar: 'from-danger' },
  primary: { tile: 'bg-primary/10 text-primary', bar: 'from-primary' },
} as const

interface KpiCardProps {
  title: string
  value: number
  format?: (n: number) => string
  sub?: string
  icon: LucideIcon
  tone?: keyof typeof TONES
  delta?: number | null
  invertDelta?: boolean
  className?: string
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.round(n))

export default function KpiCard({
  title,
  value,
  format = formatRupiah,
  sub,
  icon: Icon,
  tone = 'primary',
  delta,
  invertDelta = false,
  className,
}: KpiCardProps) {
  const animated = useCountUp(value)
  const display = format(animated)
  const deltaUp = (delta ?? 0) >= 0
  const deltaGood = isGoodDelta(delta ?? 0, invertDelta)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-hairline bg-surface-card p-3.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent', TONES[tone].bar)} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ash">{title}</p>
          <p className={cn('mt-1.5 truncate text-lg font-bold tabular-nums sm:text-xl lg:text-2xl', value < 0 ? 'text-danger' : 'text-ink')}>{display}</p>
          {sub && <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110', TONES[tone].tile)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      {delta != null && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            deltaGood ? 'bg-badge-success/10 text-badge-success' : 'bg-danger/10 text-danger',
          )}
        >
          {deltaUp ? '↑' : '↓'} {Math.abs(delta)}%
          <span className="font-normal text-muted-foreground">vs bln lalu</span>
        </div>
      )}
    </div>
  )
}
