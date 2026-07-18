'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

interface LaporanData {
  omzetServis: number; omzetPenjualan: number; marginUnit: number;
  biayaOperasional: number; labaBersih: number;
  totalTransaksiServis: number; totalTransaksiUnit: number;
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData>({ omzetServis: 0, omzetPenjualan: 0, marginUnit: 0, biayaOperasional: 0, labaBersih: 0, totalTransaksiServis: 0, totalTransaksiUnit: 0 })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => { const now = new Date(); return { month: now.getMonth() + 1, year: now.getFullYear() } })

  useEffect(() => { fetchLaporan() }, [filterMonth])

  async function fetchLaporan() {
    setLoading(true)
    try {
      const startDate = new Date(filterMonth.year, filterMonth.month - 1, 1).toISOString()
      const endDate = new Date(filterMonth.year, filterMonth.month, 0, 23, 59, 59).toISOString()
      const { data: servisData } = await supabase.from('services').select('total_fee').eq('status', 'selesai').gte('date_in', startDate).lte('date_in', endDate)
      const omzetServis = servisData?.reduce((sum, s) => sum + s.total_fee, 0) || 0
      const { data: salesData } = await supabase.from('sales').select('sell_price, buy_price, margin').eq('status', 'completed').gte('date', startDate).lte('date', endDate)
      const omzetPenjualan = salesData?.reduce((sum, s) => sum + s.sell_price, 0) || 0
      const marginUnit = salesData?.reduce((sum, s) => sum + (s.margin || s.sell_price - s.buy_price), 0) || 0
      const { data: costData } = await supabase.from('operational_costs').select('amount').eq('period_month', filterMonth.month).eq('period_year', filterMonth.year)
      const biayaOperasional = costData?.reduce((sum, c) => sum + c.amount, 0) || 0
      const labaBersih = (omzetServis + marginUnit) - biayaOperasional
      setData({ omzetServis, omzetPenjualan, marginUnit, biayaOperasional, labaBersih, totalTransaksiServis: servisData?.length || 0, totalTransaksiUnit: salesData?.length || 0 })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)' }}><div className="spinner" /></div>

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="text-h1" style={{ marginBottom: 4 }}>Laporan</h1>
        <p className="text-small" style={{ color: 'var(--color-ink-3)' }}>Laporan keuangan bulanan</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2xs)', marginBottom: 'var(--space-lg)' }}>
        <select value={filterMonth.month} onChange={e => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })} className="select select-sm" style={{ width: 160 }}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterMonth.year} onChange={e => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })} className="select select-sm" style={{ width: 120 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        <StatCard label="Omzet Servis" value={formatRupiah(data.omzetServis)} sub={`${data.totalTransaksiServis} transaksi`} icon={TrendingUp} />
        <StatCard label="Omzet Penjualan" value={formatRupiah(data.omzetPenjualan)} sub={`${data.totalTransaksiUnit} unit terjual`} icon={BarChart3} />
        <StatCard label="Biaya Operasional" value={formatRupiah(data.biayaOperasional)} icon={TrendingDown} />
        <StatCard label="Laba Bersih" value={formatRupiah(data.labaBersih)} icon={DollarSign} color={data.labaBersih >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
      </div>

      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h2 className="text-h3" style={{ marginBottom: 'var(--space-lg)' }}>Rincian Laba Rugi — {months[filterMonth.month - 1]} {filterMonth.year}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DetailRow label="(+) Omzet Servis" value={formatRupiah(data.omzetServis)} color="var(--color-accent)" />
          <DetailRow label="(+) Margin Penjualan Unit" value={formatRupiah(data.marginUnit)} color="var(--color-success)" />
          <DetailRow label="(-) Biaya Operasional" value={`-${formatRupiah(data.biayaOperasional)}`} color="var(--color-danger)" />
          <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--space-xs)', marginTop: 'var(--space-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)',
            }}>= Laba Bersih</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 600,
              color: data.labaBersih >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}>{formatRupiah(data.labaBersih)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>; color?: string;
}) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <span className="text-caption">{label}</span>
        <Icon size={16} color="var(--color-ink-3)" />
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 600,
        color: color || 'var(--color-ink)', letterSpacing: 'var(--tracking-tight)', marginBottom: 4,
      }}>{value}</div>
      {sub && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{sub}</p>}
    </div>
  )
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--color-rule)',
    }}>
      <span style={{ fontSize: 'var(--text-body)', color: 'var(--color-ink-2)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-body)', fontWeight: 500, color }}>{value}</span>
    </div>
  )
}
