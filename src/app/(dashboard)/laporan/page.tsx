'use client'

import { useEffect, useState } from 'react'
import { fetchFinanceData } from '@/lib/finance'
import { Wrench, ShoppingCart, TrendingDown, DollarSign, Users, Calendar, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/dashboard/PageHeader'
import KpiCard from '@/components/laporan/KpiCard'
import DailyChart from '@/components/laporan/DailyChart'
import DailyTable, { DailyRow } from '@/components/laporan/DailyTable'
import RincianLabaRugi from '@/components/laporan/RincianLabaRugi'
import Reveal from '@/components/laporan/Reveal'

interface LaporanData {
  omzetServis: number; omzetPenjualan: number; marginUnit: number;
  biayaOperasional: number; modalSparepart: number; labaBersih: number;
  totalTransaksiServis: number; totalTransaksiUnit: number;
}

interface ServiceDetail {
  id: string; nota_number: string; customer_name: string; device_type: string;
  device_brand: string | null; service_fee: number; parts_fee: number; total_fee: number;
  status: string; date_in: string;
}

interface SaleDetail {
  id: string; invoice_number: string; buyer_name: string; product_id: string | null;
  product_name: string; sell_price: number; buy_price: number; margin: number;
  status: string; date: string;
}

interface TopCustomer {
  name: string; total: number; count: number;
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData>({ omzetServis: 0, omzetPenjualan: 0, marginUnit: 0, biayaOperasional: 0, modalSparepart: 0, labaBersih: 0, totalTransaksiServis: 0, totalTransaksiUnit: 0 })
  const [deltas, setDeltas] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => { const now = new Date(); return { month: now.getMonth() + 1, year: now.getFullYear() } })
  const [services, setServices] = useState<ServiceDetail[]>([])
  const [sales, setSales] = useState<SaleDetail[]>([])
  const [dailySummary, setDailySummary] = useState<DailyRow[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [activeTab, setActiveTab] = useState<'servis' | 'unit' | 'harian' | 'customer'>('harian')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchLaporan() }, [filterMonth])

  async function fetchLaporan() {
    try {
      const prev = filterMonth.month === 1
        ? { month: 12, year: filterMonth.year - 1 }
        : { month: filterMonth.month - 1, year: filterMonth.year }

      const [cur, prevRes] = await Promise.all([
        fetchFinanceData({ year: filterMonth.year, month: filterMonth.month }),
        fetchFinanceData(prev),
      ])
      const { summary, services: servisData, sales: salesData, parts } = cur

      setData({
        omzetServis: summary.omzetServis,
        omzetPenjualan: summary.omzetPenjualan,
        marginUnit: summary.marginUnit,
        biayaOperasional: summary.biayaOperasional,
        modalSparepart: summary.modalSparepart,
        labaBersih: summary.labaBersih,
        totalTransaksiServis: summary.totalTransaksiServis,
        totalTransaksiUnit: summary.totalTransaksiUnit,
      })

      const pctDelta = (a: number, b: number): number | null => {
        if (b === 0) return null
        return Math.round(((a - b) / Math.abs(b)) * 100)
      }
      const ps = prevRes.summary
      setDeltas({
        omzetServis: pctDelta(summary.omzetServis, ps.omzetServis),
        omzetPenjualan: pctDelta(summary.omzetPenjualan, ps.omzetPenjualan),
        biaya: pctDelta(summary.biayaOperasional, ps.biayaOperasional),
        laba: pctDelta(summary.labaBersih, ps.labaBersih),
      })

      setServices(servisData || [])
      setSales(salesData || [])

      // Rekap harian: omzet, margin unit, modal sparepart, dan profit per hari
      const dailyMap: Record<string, DailyRow> = {}
      const addDay = (day: string) => {
        if (!dailyMap[day]) dailyMap[day] = { date: day, omzetServis: 0, omzetUnit: 0, marginUnit: 0, modalSparepart: 0, profit: 0, countServis: 0, countUnit: 0 }
      }
      servisData?.forEach(s => {
        const day = new Date(s.date_in).toISOString().split('T')[0]
        addDay(day)
        if (s.status === 'selesai') {
          dailyMap[day].omzetServis += s.total_fee
          dailyMap[day].countServis++
        }
      })
      salesData?.forEach(s => {
        const day = new Date(s.date).toISOString().split('T')[0]
        addDay(day)
        if (s.status === 'completed') {
          dailyMap[day].omzetUnit += s.sell_price
          dailyMap[day].marginUnit += s.margin ?? (s.sell_price || 0) - (s.buy_price || 0)
          dailyMap[day].countUnit++
        }
      })
      parts?.forEach(p => {
        const day = new Date(p.date_in).toISOString().split('T')[0]
        addDay(day)
        dailyMap[day].modalSparepart += (p.quantity || 0) * (p.buy_price || 0)
      })
      const daily = Object.values(dailyMap)
      daily.forEach(d => { d.profit = d.omzetServis + d.marginUnit - d.modalSparepart })
      setDailySummary(daily.sort((a, b) => b.date.localeCompare(a.date)))

      // Top customers
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

  const periodLabel = `${months[filterMonth.month - 1]} ${filterMonth.year}`
  const chartData = [...dailySummary].sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
    date: d.date,
    omzet: d.omzetServis + d.omzetUnit,
    profit: d.profit,
  }))

  // Breakdown laba rugi untuk segmented bar mobile (ala analytics-dashboard)
  const segments = [
    { label: 'Omzet Servis', value: data.omzetServis, color: 'bg-badge-success' },
    { label: 'Margin Unit', value: data.marginUnit, color: 'bg-badge-info' },
    { label: 'Modal Sparepart', value: data.modalSparepart, color: 'bg-badge-warning' },
    { label: 'Biaya Operasional', value: data.biayaOperasional, color: 'bg-danger' },
  ]
  const segmentTotal = Math.max(segments.reduce((sum, s) => sum + Math.abs(s.value), 0), 1)

  const currentIdx = new Date().getFullYear() * 12 + new Date().getMonth()
  const filterIdx = filterMonth.year * 12 + (filterMonth.month - 1)
  const isNextDisabled = filterIdx >= currentIdx

  const prevMonth = () => setFilterMonth(m => (m.month === 1 ? { month: 12, year: m.year - 1 } : { month: m.month - 1, year: m.year }))
  const nextMonth = () => setFilterMonth(m => (m.month === 12 ? { month: 1, year: m.year + 1 } : { month: m.month + 1, year: m.year }))

  const q = search.trim().toLowerCase()
  const filteredServices = q
    ? services.filter(s => `${s.nota_number} ${s.customer_name} ${s.device_brand ?? ''} ${s.device_type}`.toLowerCase().includes(q))
    : services
  const filteredSales = q
    ? sales.filter(s => `${s.invoice_number} ${s.buyer_name} ${s.product_name ?? ''}`.toLowerCase().includes(q))
    : sales

  const tabClass = (active: boolean) =>
    `flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-primary text-primary-foreground shadow-card'
        : 'bg-card text-muted-foreground border border-border hover:bg-secondary/50 hover:text-foreground'
    }`

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Reveal>
        <PageHeader
          title="Laporan Keuangan"
          subtitle="Rincian lengkap laba rugi dan transaksi"
        >
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterMonth.month}
              onChange={e => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })}
              className="flex-1 sm:flex-none h-10 rounded-lg border border-hairline-strong bg-surface px-3 text-sm"
            >
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={filterMonth.year}
              onChange={e => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })}
              className="flex-1 sm:flex-none h-10 rounded-lg border border-hairline-strong bg-surface px-3 text-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </PageHeader>
      </Reveal>

      {/* Hero mobile: Laba Bersih + segmented breakdown (ala analytics-dashboard) */}
      <div className="lg:hidden">
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-card">
          <div className="bg-gradient-to-br from-primary/[0.07] to-transparent p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ash">Laba Bersih</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevMonth}
                  aria-label="Bulan sebelumnya"
                  className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[96px] text-center text-xs font-semibold text-ink">{periodLabel}</span>
                <button
                  onClick={nextMonth}
                  disabled={isNextDisabled}
                  aria-label="Bulan berikutnya"
                  className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface text-muted-foreground transition-colors hover:bg-secondary active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className={`mt-2 text-2xl font-extrabold tabular-nums ${data.labaBersih >= 0 ? 'text-ink' : 'text-danger'}`}>
              {formatRupiah(data.labaBersih)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Omzet {formatRupiah(data.omzetServis + data.omzetPenjualan)} · {data.totalTransaksiServis + data.totalTransaksiUnit} transaksi
            </p>
            <div className="mt-4">
              <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                {segments.map(s => (
                  <div
                    key={s.label}
                    className={`${s.color} ${s.value === 0 ? 'hidden' : ''}`}
                    style={{ width: `${(Math.abs(s.value) / segmentTotal) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {segments.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${s.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="truncate text-[11px] font-semibold tabular-nums text-ink">{formatRupiah(s.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Reveal delay={60}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <KpiCard
            title="Omzet Servis"
            value={data.omzetServis}
            sub={`${data.totalTransaksiServis} transaksi`}
            icon={Wrench}
            tone="emerald"
            delta={deltas.omzetServis ?? null}
          />
          <KpiCard
            title="Omzet Penjualan"
            value={data.omzetPenjualan}
            sub={`${data.totalTransaksiUnit} unit terjual`}
            icon={ShoppingCart}
            tone="primary"
            delta={deltas.omzetPenjualan ?? null}
          />
          <KpiCard
            title="Biaya Operasional"
            value={data.biayaOperasional}
            icon={TrendingDown}
            tone="orange"
            delta={deltas.biaya ?? null}
          />
          <KpiCard
            title="Laba Bersih"
            value={data.labaBersih}
            icon={DollarSign}
            tone={data.labaBersih >= 0 ? 'emerald' : 'danger'}
            delta={deltas.laba ?? null}
          />
        </div>
      </Reveal>

      {/* Unit Terjual */}
      <Reveal delay={120}>
        <Card className="shadow-card">
          <CardContent className="p-0 sm:p-0">
            {sales.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-ink">Unit Terjual</p>
                <p className="mt-1 text-xs text-muted-foreground">Belum ada unit terjual di {periodLabel}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 pt-4">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-badge-info/15 text-badge-info">
                    <Package className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Unit Terjual</h2>
                    <p className="text-[10px] text-muted-foreground">{data.totalTransaksiUnit} unit · {sales.length} transaksi di {periodLabel}</p>
                  </div>
                </div>
                {/* Mobile */}
                <div className="mt-3 divide-y divide-hairline lg:hidden">
                  {filteredSales.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-badge-info/15 text-badge-info">
                        <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-ink">{s.product_name || 'Unit'}</p>
                          <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">#{s.invoice_number} · {s.buyer_name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold tabular-nums ${s.margin >= 0 ? 'text-badge-success' : 'text-danger'}`}>{formatRupiah(s.margin)}</p>
                        <p className="text-[10px] text-muted-foreground">Beli {formatRupiah(s.buy_price)} · Jual {formatRupiah(s.sell_price)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredSales.length === 0 && (
                    <p className="p-4 text-center text-xs text-muted-foreground">Tidak ada transaksi ditemukan</p>
                  )}
                </div>
                {/* Desktop */}
                <div className="mt-3 hidden overflow-x-auto lg:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-ash">
                        <th className="px-4 py-2.5 font-medium">Produk</th>
                        <th className="px-4 py-2.5 font-medium">Invoice</th>
                        <th className="px-4 py-2.5 font-medium">Pembeli</th>
                        <th className="px-4 py-2.5 font-medium text-right">Harga Beli</th>
                        <th className="px-4 py-2.5 font-medium text-right">Harga Jual</th>
                        <th className="px-4 py-2.5 font-medium text-right">Margin</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {sales.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                          <td className="px-4 py-3 font-medium text-ink">{s.product_name || 'Unit'}</td>
                          <td className="px-4 py-3 text-muted-foreground">#{s.invoice_number}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.buyer_name}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatRupiah(s.buy_price)}</td>
                          <td className="px-4 py-3 text-right">{formatRupiah(s.sell_price)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${s.margin >= 0 ? 'text-badge-success' : 'text-danger'}`}>{formatRupiah(s.margin)}</td>
                          <td className="px-4 py-3"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Tren Harian */}
      <Reveal delay={180}>
        {chartData.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex h-56 items-center justify-center">
              <p className="text-sm text-muted-foreground">Belum ada transaksi di {periodLabel}</p>
            </CardContent>
          </Card>
        ) : (
          <DailyChart
            data={chartData}
            title="Tren Omzet & Profit Harian"
            subtitle={`Omzet vs profit per tanggal — ${periodLabel}`}
          />
        )}
      </Reveal>

      {/* Rincian Laba Rugi */}
      <Reveal delay={240}>
        <RincianLabaRugi
          periodLabel={periodLabel}
          labaBersih={data.labaBersih}
          rows={[
            { label: '(+) Omzet Servis', value: data.omzetServis, kind: 'in' },
            { label: '(+) Margin Penjualan Unit', value: data.marginUnit, kind: 'in' },
            { label: '(-) Modal Sparepart', value: data.modalSparepart, kind: 'out' },
            { label: '(-) Biaya Operasional', value: data.biayaOperasional, kind: 'out' },
          ]}
        />
      </Reveal>

      {/* Search transaksi (mobile) */}
      <Reveal delay={280}>
        <div className="relative lg:hidden">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari transaksi…"
            className="h-11 w-full rounded-xl border border-hairline-strong bg-surface pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </Reveal>

      {/* Tabs Detail Transaksi */}
      <Reveal delay={300}>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={() => setActiveTab('servis')} className={tabClass(activeTab === 'servis')}>
            <Wrench size={14} /> Servis ({services.length})
          </button>
          <button onClick={() => setActiveTab('unit')} className={tabClass(activeTab === 'unit')}>
            <ShoppingCart size={14} /> Unit ({sales.length})
          </button>
          <button onClick={() => setActiveTab('harian')} className={tabClass(activeTab === 'harian')}>
            <Calendar size={14} /> Harian
          </button>
          <button onClick={() => setActiveTab('customer')} className={tabClass(activeTab === 'customer')}>
            <Users size={14} /> Customer
          </button>
        </div>
      </Reveal>

      {activeTab === 'servis' && (
        <Reveal delay={300}>
          <Card className="shadow-card">
            <CardContent className="p-0 sm:p-0">
              {services.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Tidak ada transaksi servis di {periodLabel}</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="divide-y divide-hairline md:hidden">
                    {filteredServices.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-badge-success/15 text-badge-success">
                          <Wrench className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm text-foreground">#{s.nota_number}</p>
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.customer_name} · {s.device_brand ? `${s.device_brand} - ` : ''}{s.device_type}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(s.date_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold tabular-nums">{formatRupiah(s.total_fee)}</p>
                          <p className="text-[10px] text-muted-foreground">Jasa {formatRupiah(s.service_fee)} · Sparepart {formatRupiah(s.parts_fee)}</p>
                        </div>
                      </div>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Tidak ada transaksi ditemukan</p>
                    )}
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-xs text-ash">
                          <th className="px-4 py-3 font-medium">Nota</th>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Perangkat</th>
                          <th className="px-4 py-3 font-medium text-right">Jasa</th>
                          <th className="px-4 py-3 font-medium text-right">Sparepart</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {services.map((s) => (
                          <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                            <td className="px-4 py-3 font-medium">#{s.nota_number}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.customer_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.device_brand ? `${s.device_brand} - ` : ''}{s.device_type}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(s.service_fee)}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(s.parts_fee)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatRupiah(s.total_fee)}</td>
                            <td className="px-4 py-3"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.date_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Reveal>
      )}

      {activeTab === 'unit' && (
        <Reveal delay={300}>
          <Card className="shadow-card">
            <CardContent className="p-0 sm:p-0">
              {sales.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Tidak ada transaksi unit di {periodLabel}</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="divide-y divide-hairline md:hidden">
                    {filteredSales.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-badge-info/15 text-badge-info">
                          <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-foreground">#{s.invoice_number}</p>
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.buyer_name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-bold tabular-nums ${s.margin >= 0 ? 'text-badge-success' : 'text-danger'}`}>{formatRupiah(s.margin)}</p>
                          <p className="text-[10px] text-muted-foreground">Beli {formatRupiah(s.buy_price)} · Jual {formatRupiah(s.sell_price)}</p>
                        </div>
                      </div>
                    ))}
                    {filteredSales.length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Tidak ada transaksi ditemukan</p>
                    )}
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-xs text-ash">
                          <th className="px-4 py-3 font-medium">Invoice</th>
                          <th className="px-4 py-3 font-medium">Pembeli</th>
                          <th className="px-4 py-3 font-medium text-right">Harga Beli</th>
                          <th className="px-4 py-3 font-medium text-right">Harga Jual</th>
                          <th className="px-4 py-3 font-medium text-right">Margin</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {sales.map((s) => (
                          <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                            <td className="px-4 py-3 font-medium">#{s.invoice_number}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.buyer_name}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{formatRupiah(s.buy_price)}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(s.sell_price)}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${s.margin >= 0 ? 'text-badge-success' : 'text-danger'}`}>{formatRupiah(s.margin)}</td>
                            <td className="px-4 py-3"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Reveal>
      )}

      {activeTab === 'harian' && (
        <Reveal delay={300}>
          <DailyTable rows={dailySummary} />
        </Reveal>
      )}

      {activeTab === 'customer' && (
        <Reveal delay={300}>
          <Card className="shadow-card">
            <CardContent className="p-0 sm:p-0">
              {topCustomers.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Belum ada customer di {periodLabel}</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="divide-y divide-hairline md:hidden">
                    {topCustomers.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-3 p-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-badge-success/15 text-badge-success' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.count} transaksi</p>
                        </div>
                        <span className="text-sm font-semibold">{formatRupiah(c.total)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-xs text-ash">
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Nama</th>
                          <th className="px-4 py-3 font-medium text-right">Jumlah Transaksi</th>
                          <th className="px-4 py-3 font-medium text-right">Total Belanja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {topCustomers.map((c, i) => (
                          <tr key={c.name} className="transition-colors hover:bg-secondary/40">
                            <td className="px-4 py-3">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-badge-success/15 text-badge-success' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                            </td>
                            <td className="px-4 py-3 font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{c.count}×</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatRupiah(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  )
}
