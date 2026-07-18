'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowUpRight, DollarSign, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ServisWeeklyChart, OmzetWeeklyChart } from '@/components/charts'
import { ActivityFeed, type Activity } from '@/components/activity-feed'
import { AttentionCard, type AlertItem } from '@/components/attention-card'
import { ServisStatusCard } from '@/components/servis-status-card'
import { formatRupiahFull, getLast7Days } from '@/lib/format'

interface DashboardStats {
  totalServis: number; servisHariIni: number; unitReady: number;
  sparepartStok: number; omzetHariIni: number; marginUnit: number;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalServis: 0, servisHariIni: 0, unitReady: 0, sparepartStok: 0, omzetHariIni: 0, marginUnit: 0 })
  const [loading, setLoading] = useState(true)
  const [servisChart, setServisChart] = useState<{ day: string; masuk: number; selesai: number }[]>([])
  const [omzetChart, setOmzetChart] = useState<{ day: string; omzet: number }[]>([])
  const [stockDist, setStockDist] = useState<{ name: string; value: number; color: string }[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [servisBreakdown, setServisBreakdown] = useState({ pending: 0, proses: 0, selesai: 0 })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()
      const days = getLast7Days()

      const [sTotal, sToday, sWeek, uReady, products, rServices, rSales, rStock, sTodayStatus, oServis, oSales] = await Promise.all([
        supabase.from('services').select('id', { count: 'exact' }),
        supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
        supabase.from('services').select('created_at, status').gte('created_at', days[0].date.toISOString()),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'ready'),
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('services').select('status').gte('created_at', todayStr),
        supabase.from('services').select('total_fee, created_at, status').eq('status', 'selesai').gte('created_at', days[0].date.toISOString()),
        supabase.from('sales').select('sell_price, margin, date').eq('status', 'completed').gte('date', days[0].date.toISOString()),
      ])

      const prods = products.data || []

      // Stats
      setStats({
        totalServis: sTotal.count || 0,
        servisHariIni: sToday.count || 0,
        unitReady: uReady.count || 0,
        sparepartStok: prods.filter(p => p.categories?.name === 'Sparepart').reduce((s, p) => s + p.quantity, 0),
        omzetHariIni: (oServis.data || []).filter(s => s.created_at.slice(0, 10) === today.toISOString().slice(0, 10)).reduce((s, r) => s + r.total_fee, 0),
        marginUnit: (oSales.data || []).filter(s => s.date.slice(0, 10) === today.toISOString().slice(0, 10)).reduce((s, r) => s + (r.margin || r.sell_price), 0),
      })

      // Servis chart
      const servisData = sWeek.data || []
      setServisChart(days.map(d => ({
        day: d.label,
        masuk: servisData.filter(s => s.created_at.slice(0, 10) === d.key).length,
        selesai: servisData.filter(s => s.created_at.slice(0, 10) === d.key && s.status === 'selesai').length,
      })))

      // Omzet chart
      const sO = oServis.data || []
      const oS = oSales.data || []
      setOmzetChart(days.map(d => ({
        day: d.label,
        omzet: sO.filter(s => s.created_at.slice(0, 10) === d.key).reduce((s, r) => s + r.total_fee, 0)
               + oS.filter(s => s.date.slice(0, 10) === d.key).reduce((s, r) => s + (r.margin || r.sell_price), 0),
      })))

      // Stock dist
      setStockDist([
        { name: 'Unit Ready', value: prods.filter(p => p.status === 'ready' && p.categories?.name === 'Unit Laptop').length, color: 'var(--primary)' },
        { name: 'Terjual', value: prods.filter(p => p.status === 'sold').length, color: 'var(--muted-foreground)' },
        { name: 'Sparepart', value: prods.filter(p => p.categories?.name === 'Sparepart').reduce((s, p) => s + p.quantity, 0), color: 'var(--success)' },
      ])

      // Servis breakdown
      const todayS = sTodayStatus.data || []
      setServisBreakdown({
        pending: todayS.filter(s => s.status === 'proses').length,
        proses: todayS.filter(s => s.status === 'proses').length,
        selesai: todayS.filter(s => s.status === 'selesai').length,
      })

      // Activities
      const recentS = (rServices.data || []).map(s => ({
        id: s.id, type: 'servis' as const,
        title: `Servis ${s.nota_number} — ${s.customer_name}`,
        description: `${s.device_type} · ${formatRupiahFull(s.total_fee)}`,
        timestamp: s.created_at,
      }))
      const recentSl = (rSales.data || []).map(s => ({
        id: s.id, type: 'sale' as const,
        title: `Penjualan ke ${s.buyer_name}`,
        description: formatRupiahFull(s.sell_price),
        timestamp: s.created_at,
      }))
      const recentSt = (rStock.data || []).map(m => ({
        id: m.id, type: m.type === 'masuk' ? 'stock_in' as const : 'stock_out' as const,
        title: `Stok ${m.type === 'masuk' ? 'masuk' : 'keluar'}: ${m.products?.name || ''}`,
        description: `${m.type === 'masuk' ? '+' : '-'}${m.quantity} · ${m.notes || ''}`,
        timestamp: m.created_at,
      }))
      setActivities([...recentS, ...recentSl, ...recentSt].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8))

      // Alerts
      setAlerts(prods.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0).map(p => ({
        id: p.id, type: 'low_stock' as const,
        title: `${p.name} stok menipis`,
        description: `Sisa ${p.quantity} unit (min: ${p.min_quantity})`,
      })))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Hero greeting - Uber Design */}
      <div className="relative overflow-hidden rounded-lg bg-surface-dark p-8 lg:p-10 shadow-card">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-on-dark lg:text-4xl" style={{ fontWeight: 700 }}>
            {profile?.name ? `Halo, ${profile.name.split(' ')[0]} 👋` : 'Dashboard'}
          </h1>
          <p className="mt-2 text-sm text-on-dark-mute">
            {dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Servis" value={stats.totalServis} icon={Wrench} loading={loading} />
        <StatCard label="Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} />
        {isAdmin && <>
          <StatCard label="Unit Ready" value={stats.unitReady} icon={Laptop} loading={loading} />
          <StatCard label="Sparepart" value={stats.sparepartStok} icon={Package} loading={loading} />
          <StatCard label="Omzet Hari Ini" value={formatRupiahFull(stats.omzetHariIni)} icon={DollarSign} loading={loading} isText />
          <StatCard label="Margin Unit" value={formatRupiahFull(stats.marginUnit)} icon={ShoppingCart} loading={loading} isText />
        </>}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OmzetWeeklyChart data={omzetChart} />
        <ServisWeeklyChart data={servisChart} />
      </div>

      {/* Breakdown + Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ServisStatusCard pending={servisBreakdown.pending} proses={servisBreakdown.proses} selesai={servisBreakdown.selesai} loading={loading} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribusi Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockDist.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">{loading ? '—' : d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity + Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed activities={activities} loading={loading} />
        <AttentionCard alerts={alerts} loading={loading} />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi Cepat</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction href="/servis" icon={Wrench} title="Servis Baru" />
          {isAdmin && <>
            <QuickAction href="/unit-laptop/beli" icon={Laptop} title="Beli Unit" />
            <QuickAction href="/laporan" icon={TrendingUp} title="Laporan" />
            <QuickAction href="/stok" icon={Package} title="Kelola Stok" />
          </>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, loading, isText }: {
  label: string; value: number | string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }>; loading: boolean; isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon size={15} color="var(--muted-foreground)" />
        </div>
        <div className={`font-serif font-bold tracking-tight text-foreground ${isText ? 'text-lg' : 'text-2xl'}`}>
          {loading ? <div className="h-7 w-16 animate-pulse rounded bg-muted" /> : value}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ href, icon: Icon, title }: {
  href: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }>; title: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-colors hover:border-primary/30 hover:bg-accent/50">
        <CardContent className="flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon size={17} className="text-primary" />
          </div>
          <span className="flex-1 text-sm font-semibold">{title}</span>
          <ArrowUpRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </CardContent>
      </Card>
    </Link>
  )
}
