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
  const [data, setData] = useState<LaporanData>({
    omzetServis: 0, omzetPenjualan: 0, marginUnit: 0, biayaOperasional: 0,
    labaBersih: 0, totalTransaksiServis: 0, totalTransaksiUnit: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  })

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
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Laporan</h1>
        <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)' }}>Laporan keuangan bulanan</p>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        <select value={filterMonth.month} onChange={(e) => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })} className="select select-sm" style={{ width:160 }}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterMonth.year} onChange={(e) => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })} className="select select-sm" style={{ width:120 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 }}>
        <StatCard label="Omzet Servis" value={formatRupiah(data.omzetServis)} sub={`${data.totalTransaksiServis} transaksi`} icon={TrendingUp} color="var(--primary)" bgColor="rgba(83,58,253,0.08)" />
        <StatCard label="Omzet Penjualan" value={formatRupiah(data.omzetPenjualan)} sub={`${data.totalTransaksiUnit} unit terjual`} icon={BarChart3} color="#15be53" bgColor="rgba(21,190,83,0.08)" />
        <StatCard label="Biaya Operasional" value={formatRupiah(data.biayaOperasional)} icon={TrendingDown} color="var(--danger)" bgColor="var(--danger-bg)" />
        <StatCard label="Laba Bersih" value={formatRupiah(data.labaBersih)} icon={DollarSign} color={data.labaBersih >= 0 ? '#15be53' : 'var(--danger)'} bgColor={data.labaBersih >= 0 ? 'rgba(21,190,83,0.08)' : 'var(--danger-bg)'} />
      </div>

      {/* Detail */}
      <div className="card" style={{ padding:24 }}>
        <h2 style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:20 }}>
          Rincian Laba Rugi — {months[filterMonth.month - 1]} {filterMonth.year}
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <DetailRow label="(+) Omzet Servis" value={formatRupiah(data.omzetServis)} color="var(--primary)" />
          <DetailRow label="(+) Margin Penjualan Unit" value={formatRupiah(data.marginUnit)} color="#15be53" />
          <DetailRow label="(-) Biaya Operasional" value={`-${formatRupiah(data.biayaOperasional)}`} color="var(--danger)" />
          <div style={{ borderTop:'1px solid var(--hairline)', paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:16, fontWeight:500, color:'var(--ink)' }}>= Laba Bersih</span>
            <span style={{ fontSize:20, fontWeight:600, color: data.labaBersih >= 0 ? '#15be53' : 'var(--danger)', letterSpacing:'-0.4px' }}>
              {formatRupiah(data.labaBersih)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color, bgColor }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>; color: string; bgColor: string;
}) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:12, fontWeight:400, color:'var(--mute)' }}>{label}</span>
        <div style={{ width:32, height:32, borderRadius:6, background:bgColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <p style={{ fontSize:12, fontWeight:300, color:'var(--stone)' }}>{sub}</p>}
    </div>
  )
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--hairline)' }}>
      <span style={{ fontSize:14, fontWeight:300, color:'var(--charcoal)' }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:500, color }}>{value}</span>
    </div>
  )
}
