'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import StatCard from '@/components/dashboard/StatCard'
import PageHeader from '@/components/dashboard/PageHeader'

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

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <div>
      <PageHeader
        title="Laporan Keuangan"
        subtitle="Ringkasan laba rugi dan transaksi bulanan"
      >
        <div className="flex gap-2">
          <select 
            value={filterMonth.month} 
            onChange={e => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })} 
            className="h-[44px] rounded-lg border border-hairline-strong bg-surface px-4 text-sm"
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select 
            value={filterMonth.year} 
            onChange={e => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })} 
            className="h-[44px] rounded-lg border border-hairline-strong bg-surface px-4 text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard 
          title="Omzet Servis" 
          value={formatRupiah(data.omzetServis)} 
          sub={`${data.totalTransaksiServis} transaksi`} 
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard 
          title="Omzet Penjualan" 
          value={formatRupiah(data.omzetPenjualan)} 
          sub={`${data.totalTransaksiUnit} unit terjual`} 
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard 
          title="Biaya Operasional" 
          value={formatRupiah(data.biayaOperasional)} 
          icon={TrendingDown}
          color="orange"
        />
        <StatCard 
          title="Laba Bersih" 
          value={formatRupiah(data.labaBersih)} 
          icon={DollarSign}
          color={data.labaBersih >= 0 ? 'emerald' : 'danger'}
          valueClass={data.labaBersih >= 0 ? 'text-badge-success' : 'text-danger'}
        />
      </div>

      {/* Rincian Laba Rugi */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-5 text-ink" style={{ fontWeight: 700 }}>
          Rincian Laba Rugi — {months[filterMonth.month - 1]} {filterMonth.year}
        </h2>
        <div className="space-y-0">
          <DetailRow label="(+) Omzet Servis" value={formatRupiah(data.omzetServis)} color="text-badge-success" />
          <DetailRow label="(+) Margin Penjualan Unit" value={formatRupiah(data.marginUnit)} color="text-badge-success" />
          <DetailRow label="(-) Biaya Operasional" value={`-${formatRupiah(data.biayaOperasional)}`} color="text-danger" />
          <div className="border-t border-hairline pt-3 mt-3 flex justify-between items-center">
            <span className="text-base font-bold text-ink" style={{ fontWeight: 700 }}>
              = Laba Bersih
            </span>
            <span className={`text-2xl font-bold ${data.labaBersih >= 0 ? 'text-badge-success' : 'text-danger'}`} style={{ fontWeight: 700 }}>
              {formatRupiah(data.labaBersih)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-hairline">
      <span className="text-sm text-charcoal">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  )
}
