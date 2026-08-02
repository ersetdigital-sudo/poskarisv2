'use client'

import { cn } from '@/lib/utils'

interface RincianRow {
  label: string
  value: number
  kind: 'in' | 'out'
}

interface RincianLabaRugiProps {
  rows: RincianRow[]
  labaBersih: number
  periodLabel: string
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export default function RincianLabaRugi({ rows, labaBersih, periodLabel }: RincianLabaRugiProps) {
  const max = Math.max(...rows.map(r => Math.abs(r.value)), 1)

  return (
    <div className="rounded-xl border border-hairline bg-surface-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">Rincian Laba Rugi</h2>
        <span className="truncate text-xs text-muted-foreground">{periodLabel}</span>
      </div>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className={cn('shrink-0 font-mono font-medium', r.kind === 'in' ? 'text-badge-success' : 'text-danger')}>
                {r.kind === 'in' ? formatRupiah(r.value) : `-${formatRupiah(r.value)}`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all duration-700', r.kind === 'in' ? 'bg-badge-success' : 'bg-danger')}
                style={{ width: `${Math.min((Math.abs(r.value) / max) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3">
        <span className="text-base font-bold text-ink">= Laba Bersih</span>
        <span className={cn('text-xl font-bold tabular-nums sm:text-2xl', labaBersih >= 0 ? 'text-badge-success' : 'text-danger')}>
          {formatRupiah(labaBersih)}
        </span>
      </div>
    </div>
  )
}
