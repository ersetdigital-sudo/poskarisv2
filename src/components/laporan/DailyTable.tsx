'use client'

import { ShoppingCart, Wrench, PackageX, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DailyRow {
  date: string
  omzetServis: number
  omzetUnit: number
  marginUnit: number
  pembelianSparepart: number
  profit: number
  countServis: number
  countUnit: number
}

interface DailyTableProps {
  rows: DailyRow[]
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatTanggal = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', opts)

export default function DailyTable({ rows }: DailyTableProps) {
  const totals = rows.reduce(
    (acc, d) => ({
      omzetServis: acc.omzetServis + d.omzetServis,
      omzetUnit: acc.omzetUnit + d.omzetUnit,
      marginUnit: acc.marginUnit + d.marginUnit,
      pembelianSparepart: acc.pembelianSparepart + d.pembelianSparepart,
      profit: acc.profit + d.profit,
      countServis: acc.countServis + d.countServis,
      countUnit: acc.countUnit + d.countUnit,
    }),
    { omzetServis: 0, omzetUnit: 0, marginUnit: 0, pembelianSparepart: 0, profit: 0, countServis: 0, countUnit: 0 },
  )

  const profitClass = (v: number) => (v >= 0 ? 'text-badge-success' : 'text-danger')

  return (
    <div className="rounded-xl border border-hairline bg-surface-card shadow-card">
      {/* Mobile Card View */}
      <div className="block divide-y divide-hairline lg:hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Belum ada data harian</div>
        ) : rows.map(d => (
          <div key={d.date} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">
                {formatTanggal(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-[10px] text-stone">{d.countServis + d.countUnit} transaksi</p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wrench size={12} className="shrink-0" />
                <span>Omzet Servis</span>
                <span className="ml-auto font-mono font-medium text-ink">{formatRupiah(d.omzetServis)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ShoppingCart size={12} className="shrink-0" />
                <span>Omzet Unit</span>
                <span className="ml-auto font-mono font-medium text-ink">{formatRupiah(d.omzetUnit)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp size={12} className="shrink-0" />
                <span>Margin Unit</span>
                <span className="ml-auto font-mono font-medium text-badge-success">{formatRupiah(d.marginUnit)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <PackageX size={12} className="shrink-0" />
                <span>Pembelian Sparepart</span>
                <span className="ml-auto font-mono font-medium text-danger">{formatRupiah(d.pembelianSparepart)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-hairline pt-1.5">
              <span className="text-[10px] text-muted-foreground">Profit Hari Ini</span>
              <span className={cn('text-sm font-bold font-mono', profitClass(d.profit))}>{formatRupiah(d.profit)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-secondary/30">
              <th className="p-3 text-left text-xs font-medium uppercase text-ash">Tanggal</th>
              <th className="p-3 text-right text-xs font-medium uppercase text-ash">Omzet Servis</th>
              <th className="p-3 text-center text-xs font-medium uppercase text-ash">Servis</th>
              <th className="p-3 text-right text-xs font-medium uppercase text-ash">Omzet Unit</th>
              <th className="p-3 text-center text-xs font-medium uppercase text-ash">Unit</th>
              <th className="p-3 text-right text-xs font-medium uppercase text-ash">Margin Unit</th>
              <th className="p-3 text-right text-xs font-medium uppercase text-ash">Pembelian Sparepart</th>
              <th className="p-3 text-right text-xs font-medium uppercase text-ash">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-stone">Belum ada data harian</td>
              </tr>
            ) : rows.map(d => (
              <tr key={d.date} className="border-b border-hairline transition-colors hover:bg-secondary/20">
                <td className="p-3 text-xs font-medium text-ink">
                  {formatTanggal(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td className="p-3 text-right font-mono text-xs">{formatRupiah(d.omzetServis)}</td>
                <td className="p-3 text-center text-xs">{d.countServis}</td>
                <td className="p-3 text-right font-mono text-xs">{formatRupiah(d.omzetUnit)}</td>
                <td className="p-3 text-center text-xs">{d.countUnit}</td>
                <td className="p-3 text-right font-mono text-xs text-badge-success">{formatRupiah(d.marginUnit)}</td>
                <td className="p-3 text-right font-mono text-xs text-danger">
                  {d.pembelianSparepart > 0 ? formatRupiah(d.pembelianSparepart) : '-'}
                </td>
                <td className={cn('p-3 text-right font-mono text-xs font-bold', profitClass(d.profit))}>
                  {formatRupiah(d.profit)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-hairline-strong bg-secondary/40">
                <td className="p-3 text-xs font-bold uppercase text-ink">Total</td>
                <td className="p-3 text-right font-mono text-xs font-bold text-ink">{formatRupiah(totals.omzetServis)}</td>
                <td className="p-3 text-center text-xs font-bold text-ink">{totals.countServis}</td>
                <td className="p-3 text-right font-mono text-xs font-bold text-ink">{formatRupiah(totals.omzetUnit)}</td>
                <td className="p-3 text-center text-xs font-bold text-ink">{totals.countUnit}</td>
                <td className="p-3 text-right font-mono text-xs font-bold text-badge-success">{formatRupiah(totals.marginUnit)}</td>
                <td className="p-3 text-right font-mono text-xs font-bold text-danger">{formatRupiah(totals.pembelianSparepart)}</td>
                <td className={cn('p-3 text-right font-mono text-sm font-bold', profitClass(totals.profit))}>
                  {formatRupiah(totals.profit)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
