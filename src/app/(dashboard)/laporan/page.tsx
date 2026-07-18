'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Wrench, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/dashboard/StatCard'
import PageHeader from '@/components/dashboard/PageHeader'

interface LaporanData {
  omzetServis: number; omzetPenjualan: number; marginUnit: number;
  biayaOperasional: number; labaBersih: number;
  totalTransaksiServis: number; totalTransaksiUnit: number;
}

interface ServiceDetail {
  id: string; nota_number: string; customer_name: string; device_type: string;
  device_brand: string | null; service_fee: number; parts_fee: number; total_fee: number;
  status: string; date_in: string;
}

interface SaleDetail {
  id: string; invoice_number: string; buyer_name: string; product_id: string;
  sell_price: number; buy_price: number; margin: number; status: string; date: string;
}

interface DailySummary {
  date: string; omzetServis: number; omzetUnit: number; countServis: number; countUnit: number;
}

interface TopCustomer {
  name: string; total: number; count: number;
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData>({ omzetServis: 0, omzetPenjualan: 0, marginUnit: 0, biayaOperasional: 0, labaBersih: 0, totalTransaksiServis: 0, totalTransaksiUnit: 0 })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => { const now = new Date(); return { month: now.getMonth() + 1, year: now.getFullYear() } })
  const [services, setServices] = useState<ServiceDetail[]>([])
  const [sales, setSales] = useState<SaleDetail[]>([])
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [activeTab, setActiveTab] = useState<'servis' | 'unit' | 'harian' | 'customer'>('servis')

  useEffect(() => { fetchLaporan() }, [filterMonth])

  async function fetchLaporan() {
    setLoading(true)
    try {
      const startDate = new Date(filterMonth.year, filterMonth.month - 1, 1).toISOString()
      const endDate = new Date(filterMonth.year, filterMonth.month, 0, 23, 59, 59).toISOString()
      
      // Fetch services
      const { data: servisData } = await supabase.from('services')
        .select('id, nota_number, customer_name, device_type, device_brand, service_fee, parts_fee, total_fee, status, date_in')
        .gte('date_in', startDate).lte('date_in', endDate)
        .order('date_in', { ascending: false })
      
      // Fetch sales
      const { data: salesData } = await supabase.from('sales')
        .select('id, invoice_number, buyer_name, product_id, sell_price, buy_price, margin, status, date')
        .gte('date', startDate).lte('date', endDate)
        .order('date', { ascending: false })
      
      // Fetch operational costs
      const { data: costData } = await supabase.from('operational_costs')
        .select('amount').eq('period_month', filterMonth.month).eq('period_year', filterMonth.year)
      
      // Calculate totals
      const omzetServis = servisData?.reduce((sum, s) => sum + (s.status === 'selesai' ? s.total_fee : 0), 0) || 0
      const omzetPenjualan = salesData?.reduce((sum, s) => sum + (s.status === 'completed' ? s.sell_price : 0), 0) || 0
      const marginUnit = salesData?.reduce((sum, s) => sum + (s.status === 'completed' ? (s.margin || s.sell_price - s.buy_price) : 0), 0) || 0
      const biayaOperasional = costData?.reduce((sum, c) => sum + c.amount, 0) || 0
      const labaBersih = (omzetServis + marginUnit) - biayaOperasional
      
      setData({
        omzetServis, omzetPenjualan, marginUnit, biayaOperasional, labaBersih,
        totalTransaksiServis: servisData?.filter(s => s.status === 'selesai').length || 0,
        totalTransaksiUnit: salesData?.filter(s => s.status === 'completed').length || 0,
      })
      
      setServices(servisData || [])
      setSales(salesData || [])
      
      // Calculate daily summary
      const dailyMap: Record<string, DailySummary> = {}
      servisData?.forEach(s => {
        const day = new Date(s.date_in).toISOString().split('T')[0]
        if (!dailyMap[day]) dailyMap[day] = { date: day, omzetServis: 0, omzetUnit: 0, countServis: 0, countUnit: 0 }
        if (s.status === 'selesai') {
          dailyMap[day].omzetServis += s.total_fee
          dailyMap[day].countServis++
        }
      })
      salesData?.forEach(s => {
        const day = new Date(s.date).toISOString().split('T')[0]
        if (!dailyMap[day]) dailyMap[day] = { date: day, omzetServis: 0, omzetUnit: 0, countServis: 0, countUnit: 0 }
        if (s.status === 'completed') {
          dailyMap[day].omzetUnit += s.sell_price
          dailyMap[day].countUnit++
        }
      })
      setDailySummary(Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)))
      
      // Calculate top customers
      const customerMap: Record<string, TopCustomer> = {}
      servisData?.forEach(s => {
        if (!customerMap[s.customer_name]) customerMap[s.customer_name] = { name: s.customer_name, total: 0, count: 0 }
        if (s.status === 'selesai') {
          customerMap[s.customer_name].total += s.total_fee
          customerMap[s.customer_name].count++
        }
      })
      salesData?.forEach(s => {
        if (!customerMap[s.buyer_name]) customerMap[s.buyer_name] = { name: s.buyer_name, total: 0, count: 0 }
        if (s.status === 'completed') {
          customerMap[s.buyer_name].total += s.sell_price
          customerMap[s.buyer_name].count++
        }
      })
      setTopCustomers(Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 10))
      
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const statusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
    const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      selesai: 'success', completed: 'success', proses: 'warning', returned: 'destructive', cancelled: 'destructive', dibatalkan: 'destructive',
    }
    return map[status] || 'secondary'
  }

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan Keuangan"
        subtitle="Rincian lengkap laba rugi dan transaksi"
      >
        <div className="flex gap-2">
          <select 
            value={filterMonth.month} 
            onChange={e => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })} 
            className="h-10 rounded-lg border border-hairline-strong bg-surface px-3 text-sm"
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select 
            value={filterMonth.year} 
            onChange={e => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })} 
            className="h-10 rounded-lg border border-hairline-strong bg-surface px-3 text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard 
          title="Omzet Servis" 
          value={formatRupiah(data.omzetServis)} 
          sub={`${data.totalTransaksiServis} transaksi`} 
          icon={Wrench}
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
      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-5">
          <h2 className="text-base font-bold mb-4 text-ink">
            Rincian Laba Rugi — {months[filterMonth.month - 1]} {filterMonth.year}
          </h2>
          <div className="space-y-0">
            <DetailRow label="(+) Omzet Servis" value={formatRupiah(data.omzetServis)} color="text-badge-success" />
            <DetailRow label="(+) Margin Penjualan Unit" value={formatRupiah(data.marginUnit)} color="text-badge-success" />
            <DetailRow label="(-) Biaya Operasional" value={`-${formatRupiah(data.biayaOperasional)}`} color="text-danger" />
            <div className="border-t border-hairline pt-3 mt-3 flex justify-between items-center">
              <span className="text-base font-bold text-ink">= Laba Bersih</span>
              <span className={`text-xl sm:text-2xl font-bold ${data.labaBersih >= 0 ? 'text-badge-success' : 'text-danger'}`}>
                {formatRupiah(data.labaBersih)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Detail Transaksi */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('servis')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'servis' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'}`}>
          <Wrench size={14} /> Servis ({services.length})
        </button>
        <button onClick={() => setActiveTab('unit')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'unit' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'}`}>
          <ShoppingCart size={14} /> Unit ({sales.length})
        </button>
        <button onClick={() => setActiveTab('harian')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'harian' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'}`}>
          <Calendar size={14} /> Harian
        </button>
        <button onClick={() => setActiveTab('customer')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'}`}>
          <Users size={14} /> Customer
        </button>
      </div>

      {/* Detail Servis */}
      {activeTab === 'servis' && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-hairline">
              {services.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Belum ada transaksi servis</div>
              ) : services.map(s => (
                <div key={s.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-ink">{s.nota_number}</span>
                    <Badge variant={statusVariant(s.status)} className="text-[10px] px-1.5 py-0.5">{s.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-ink">{s.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{s.device_type} {s.device_brand}</p>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-stone">{new Date(s.date_in).toLocaleDateString('id-ID')}</span>
                    <span className="text-sm font-bold font-mono text-ink">{formatRupiah(s.total_fee)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30">
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Nota</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Customer</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Perangkat</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Jasa</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Sparepart</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Total</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-xs text-stone">Belum ada transaksi servis</td></tr>
                  ) : services.map(s => (
                    <tr key={s.id} className="border-b border-hairline hover:bg-secondary/20">
                      <td className="p-3 text-xs font-mono font-semibold text-ink">{s.nota_number}</td>
                      <td className="p-3 text-xs font-medium text-ink">{s.customer_name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{s.device_type} {s.device_brand}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(s.service_fee)}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(s.parts_fee)}</td>
                      <td className="p-3 text-xs text-right font-mono font-bold">{formatRupiah(s.total_fee)}</td>
                      <td className="p-3"><Badge variant={statusVariant(s.status)} className="text-[10px] px-1.5 py-0.5">{s.status}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(s.date_in).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Penjualan Unit */}
      {activeTab === 'unit' && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-hairline">
              {sales.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Belum ada transaksi penjualan</div>
              ) : sales.map(s => (
                <div key={s.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-ink">{s.invoice_number || '-'}</span>
                    <Badge variant={statusVariant(s.status)} className="text-[10px] px-1.5 py-0.5">{s.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-ink">{s.buyer_name}</p>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-stone">{new Date(s.date).toLocaleDateString('id-ID')}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-ink">{formatRupiah(s.sell_price)}</p>
                      <p className="text-[10px] text-badge-success font-mono">margin: {formatRupiah(s.margin || s.sell_price - s.buy_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30">
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Invoice</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Pembeli</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Harga Beli</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Harga Jual</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Margin</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-xs text-stone">Belum ada transaksi penjualan</td></tr>
                  ) : sales.map(s => (
                    <tr key={s.id} className="border-b border-hairline hover:bg-secondary/20">
                      <td className="p-3 text-xs font-mono font-semibold text-ink">{s.invoice_number || '-'}</td>
                      <td className="p-3 text-xs font-medium text-ink">{s.buyer_name}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(s.buy_price)}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(s.sell_price)}</td>
                      <td className="p-3 text-xs text-right font-mono font-bold text-badge-success">{formatRupiah(s.margin || s.sell_price - s.buy_price)}</td>
                      <td className="p-3"><Badge variant={statusVariant(s.status)} className="text-[10px] px-1.5 py-0.5">{s.status}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rekap Harian */}
      {activeTab === 'harian' && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-hairline">
              {dailySummary.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Belum ada data harian</div>
              ) : dailySummary.map(d => (
                <div key={d.date} className="p-3 space-y-1.5">
                  <p className="text-sm font-semibold text-ink">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Wrench size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Servis:</span>
                      <span className="font-mono font-medium text-ink">{formatRupiah(d.omzetServis)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="font-mono font-medium text-ink">{formatRupiah(d.omzetUnit)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-hairline">
                    <span className="text-[10px] text-stone">{d.countServis + d.countUnit} transaksi</span>
                    <span className="text-sm font-bold font-mono text-ink">{formatRupiah(d.omzetServis + d.omzetUnit)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30">
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Tanggal</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Omzet Servis</th>
                    <th className="text-center p-3 text-xs font-medium text-ash uppercase">Transaksi Servis</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Omzet Unit</th>
                    <th className="text-center p-3 text-xs font-medium text-ash uppercase">Transaksi Unit</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Total Hari Ini</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-xs text-stone">Belum ada data harian</td></tr>
                  ) : dailySummary.map(d => (
                    <tr key={d.date} className="border-b border-hairline hover:bg-secondary/20">
                      <td className="p-3 text-xs font-medium text-ink">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(d.omzetServis)}</td>
                      <td className="p-3 text-xs text-center">{d.countServis}</td>
                      <td className="p-3 text-xs text-right font-mono">{formatRupiah(d.omzetUnit)}</td>
                      <td className="p-3 text-xs text-center">{d.countUnit}</td>
                      <td className="p-3 text-xs text-right font-mono font-bold">{formatRupiah(d.omzetServis + d.omzetUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Customer */}
      {activeTab === 'customer' && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-hairline">
              {topCustomers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Belum ada data customer</div>
              ) : topCustomers.map((c, i) => (
                <div key={c.name} className="p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.count} transaksi</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-ink">{formatRupiah(c.total)}</span>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30">
                    <th className="text-center p-3 text-xs font-medium text-ash uppercase w-12">#</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase">Nama Customer</th>
                    <th className="text-center p-3 text-xs font-medium text-ash uppercase">Jumlah Transaksi</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-xs text-stone">Belum ada data customer</td></tr>
                  ) : topCustomers.map((c, i) => (
                    <tr key={c.name} className="border-b border-hairline hover:bg-secondary/20">
                      <td className="p-3 text-xs text-center font-bold text-muted-foreground">{i + 1}</td>
                      <td className="p-3 text-sm font-medium text-ink">{c.name}</td>
                      <td className="p-3 text-xs text-center">{c.count}x</td>
                      <td className="p-3 text-xs text-right font-mono font-bold">{formatRupiah(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-hairline">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium font-mono ${color}`}>{value}</span>
    </div>
  )
}
