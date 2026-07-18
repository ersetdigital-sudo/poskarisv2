'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowUpRight, DollarSign, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { ServisWeeklyChart, StokDonutChart, OmzetWeeklyChart } from '@/components/charts'
import { ActivityFeed, type Activity } from '@/components/activity-feed'
import { AttentionCard, type AlertItem } from '@/components/attention-card'
import { ServisStatusCard } from '@/components/servis-status-card'
import { formatRupiahFull, getLast7Days } from '@/lib/format'

interface DashboardStats {
  totalServis: number
  servisHariIni: number
  unitReady: number
  sparepartStok: number
  omzetHariIni: number
  marginUnit: number
}

interface WeeklyServis { day: string; masuk: number; selesai: number }
interface WeeklyOmzet { day: string; omzet: number }
interface StockDist { name: string; value: number; color: string }

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalServis: 0, servisHariIni: 0, unitReady: 0, sparepartStok: 0, omzetHariIni: 0, marginUnit: 0 })
  const [loading, setLoading] = useState(true)
  const [servisChart, setServisChart] = useState<WeeklyServis[]>([])
  const [omzetChart, setOmzetChart] = useState<WeeklyOmzet[]>([])
  const [stockDist, setStockDist] = useState<StockDist[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [servisBreakdown, setServisBreakdown] = useState({ pending: 0, proses: 0, selesai: 0 })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()
      const days = getLast7Days()

      // Fetch all data in parallel
      const promises: Promise<unknown>[] = [
        // 0: total servis
        supabase.from('services').select('id', { count: 'exact' }),
        // 1: servis hari ini
        supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
        // 2: servis 7 hari
        supabase.from('services').select('created_at, status').gte('created_at', days[0].date.toISOString()),
        // 3: unit ready
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'ready'),
        // 4: all products (for stock dist & low stock)
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        // 5: recent services
        supabase.from('services').select('*').order('created_at', { ascending: false }).limit(5),
        // 6: recent sales
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(5),
        // 7: recent stock movements
        supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(5),
        // 8: servis breakdown today
        supabase.from('services').select('status').gte('created_at', todayStr),
        // 9: omzet 7 hari (services)
        supabase.from('services').select('total_fee, created_at, status').eq('status', 'selesai').gte('created_at', days[0].date.toISOString()),
        // 10: omzet 7 hari (sales)
        supabase.from('sales').select('sell_price, margin, date').eq('status', 'completed').gte('date', days[0].date.toISOString()),
      ]

      if (isAdmin) {
        // Also fetch sparepart stock for admin
        const catRes = await supabase.from('categories').select('id').eq('name', 'Sparepart').single()
        if (catRes.data) {
          promises.push(
            supabase.from('products').select('quantity').eq('category_id', catRes.data.id)
          )
        }
      }

      const results = await Promise.all(promises)

      // Stats
      const totalServis = (results[0] as { count: number | null }).count || 0
      const servisHariIni = (results[1] as { count: number | null }).count || 0
      const unitReady = (results[3] as { count: number | null }).count || 0
      const products = (results[4] as { data: Array<{ quantity: number; min_quantity: number; categories?: { name: string }; name: string; id: string }> }).data || []
      const sparepartStok = products
        .filter(p => p.categories?.name === 'Sparepart')
        .reduce((s, p) => s + p.quantity, 0)

      // Servis chart (7 hari)
      const servisData = (results[2] as { data: Array<{ created_at: string; status: string }> }).data || []
      const chartData = days.map(d => {
        const dayServis = servisData.filter(s => s.created_at.slice(0, 10) === d.key)
        return {
          day: d.label,
          masuk: dayServis.length,
          selesai: dayServis.filter(s => s.status === 'selesai').length,
        }
      })
      setServisChart(chartData)

      // Omzet chart (7 hari)
      const servisOmzet = (results[9] as { data: Array<{ total_fee: number; created_at: string }> }).data || []
      const salesOmzet = (results[10] as { data: Array<{ sell_price: number; margin: number; date: string }> }).data || []
      const omzetData = days.map(d => {
        const dayServis = servisOmzet.filter(s => s.created_at.slice(0, 10) === d.key).reduce((s, r) => s + r.total_fee, 0)
        const daySales = salesOmzet.filter(s => s.date.slice(0, 10) === d.key).reduce((s, r) => s + (r.margin || r.sell_price), 0)
        return { day: d.label, omzet: dayServis + daySales }
      })
      setOmzetChart(omzetData)

      // Omzet hari ini
      const omzetHariIni = servisOmzet.filter(s => s.created_at.slice(0, 10) === today.toISOString().slice(0, 10)).reduce((s, r) => s + r.total_fee, 0)
      const marginUnit = salesOmzet.filter(s => s.date.slice(0, 10) === today.toISOString().slice(0, 10)).reduce((s, r) => s + (r.margin || r.sell_price), 0)

      // Stock distribution
      const readyCount = products.filter(p => p.status === 'ready' && p.categories?.name === 'Unit Laptop').length
      const soldCount = products.filter(p => p.status === 'sold').length
      const sparepartCount = products.filter(p => p.categories?.name === 'Sparepart').reduce((s, p) => s + p.quantity, 0)
      setStockDist([
        { name: 'Unit Ready', value: readyCount, color: 'var(--color-accent)' },
        { name: 'Terjual', value: soldCount, color: 'var(--color-ink-3)' },
        { name: 'Sparepart', value: sparepartCount, color: 'var(--color-success)' },
      ])

      // Servis breakdown
      const todayServis = (results[8] as { data: Array<{ status: string }> }).data || []
      setServisBreakdown({
        pending: todayServis.filter(s => s.status === 'proses').length,
        proses: todayServis.filter(s => s.status === 'proses').length,
        selesai: todayServis.filter(s => s.status === 'selesai').length,
      })

      // Activities — merge recent services, sales, stock movements
      const recentServices = ((results[5] as { data: Array<{ id: string; nota_number: string; customer_name: string; device_type: string; total_fee: number; status: string; created_at: string }> }).data || []).map(s => ({
        id: s.id, type: 'servis' as const,
        title: `Servis ${s.nota_number} — ${s.customer_name}`,
        description: `${s.device_type} · ${formatRupiahFull(s.total_fee)}`,
        timestamp: s.created_at,
      }))
      const recentSales = ((results[6] as { data: Array<{ id: string; buyer_name: string; sell_price: number; created_at: string }> }).data || []).map(s => ({
        id: s.id, type: 'sale' as const,
        title: `Penjualan unit ke ${s.buyer_name}`,
        description: `${formatRupiahFull(s.sell_price)}`,
        timestamp: s.created_at,
      }))
      const recentStock = ((results[7] as { data: Array<{ id: string; type: string; quantity: number; notes: string | null; created_at: string; products?: { name: string } }> }).data || []).map(m => ({
        id: m.id, type: m.type === 'masuk' ? 'stock_in' as const : 'stock_out' as const,
        title: `Stok ${m.type === 'masuk' ? 'masuk' : 'keluar'}: ${m.products?.name || ''}`,
        description: `${m.type === 'masuk' ? '+' : '-'}${m.quantity} · ${m.notes || ''}`,
        timestamp: m.created_at,
      }))

      const allActivities = [...recentServices, ...recentSales, ...recentStock]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8)
      setActivities(allActivities)

      // Alerts — low stock
      const lowStockItems = products.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0)
      const alertItems: AlertItem[] = lowStockItems.map(p => ({
        id: p.id,
        type: 'low_stock' as const,
        title: `${p.name} stok menipis`,
        description: `Sisa ${p.quantity} unit (min: ${p.min_quantity})`,
      }))
      setAlerts(alertItems)

      setStats({ totalServis, servisHariIni, unitReady, sparepartStok, omzetHariIni, marginUnit })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Hero greeting bar */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-accent), oklch(42% 0.2 295))',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl) var(--space-2xl)',
        marginBottom: 'var(--space-xl)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 200, height: 200,
          borderRadius: '50%', background: 'oklch(100% 0 0 / 0.08)',
        }} />
        <div style={{
          position: 'absolute', right: 80, bottom: -50, width: 140, height: 140,
          borderRadius: '50%', background: 'oklch(100% 0 0 / 0.05)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', fontWeight: 700,
            color: '#fff', letterSpacing: 'var(--tracking-display)', marginBottom: 6,
          }}>
            {profile?.name ? `Halo, ${profile.name.split(' ')[0]} 👋` : 'Dashboard'}
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: 'oklch(90% 0.02 275)' }}>
            {dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}
          </p>
        </div>
      </div>

      {/* Stat Cards Row 1 — Key metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
      }}>
        <StatCard label="Total Servis" value={stats.totalServis.toString()} icon={Wrench} loading={loading} accent="primary" />
        <StatCard label="Servis Hari Ini" value={stats.servisHariIni.toString()} icon={TrendingUp} loading={loading} accent="info" />
        {isAdmin && <>
          <StatCard label="Unit Ready" value={stats.unitReady.toString()} icon={Laptop} loading={loading} accent="success" />
          <StatCard label="Sparepart Stok" value={stats.sparepartStok.toString()} icon={Package} loading={loading} accent="warning" />
          <StatCard label="Omzet Hari Ini" value={formatRupiahFull(stats.omzetHariIni)} icon={DollarSign} loading={loading} accent="success" />
          <StatCard label="Margin Unit" value={formatRupiahFull(stats.marginUnit)} icon={ShoppingCart} loading={loading} accent="primary" />
        </>}
      </div>

      {/* Charts Row — 2 columns */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
      }}>
        <OmzetWeeklyChart data={omzetChart} />
        <ServisWeeklyChart data={servisChart} />
      </div>

      {/* Second Row — Servis Breakdown + Stock Distribution */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
      }}>
        <ServisStatusCard
          pending={servisBreakdown.pending}
          proses={servisBreakdown.proses}
          selesai={servisBreakdown.selesai}
          loading={loading}
        />
        <StokDonutChart data={stockDist} />
      </div>

      {/* Third Row — Activity Feed + Alerts */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
      }}>
        <ActivityFeed activities={activities} loading={loading} />
        <AttentionCard alerts={alerts} loading={loading} />
      </div>

      {/* Quick Actions — compact row */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-xs)',
        }}>Aksi Cepat</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-xs)',
        }}>
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

const accentColors: Record<string, { bg: string; icon: string; border: string }> = {
  primary: { bg: 'var(--color-accent-soft)', icon: 'var(--color-accent)', border: 'oklch(54% 0.24 275 / 0.25)' },
  success: { bg: 'var(--color-success-bg)', icon: 'var(--color-success)', border: 'oklch(62% 0.18 155 / 0.25)' },
  warning: { bg: 'var(--color-warning-bg)', icon: 'var(--color-warning)', border: 'oklch(72% 0.16 75 / 0.25)' },
  info:    { bg: 'var(--color-info-bg)', icon: 'var(--color-accent)', border: 'oklch(54% 0.24 275 / 0.25)' },
}

function StatCard({ label, value, icon: Icon, loading, accent = 'primary' }: {
  label: string; value: string; icon: React.ComponentType<{ size?: number; color?: string }>; loading: boolean; accent?: string;
}) {
  const colors = accentColors[accent] || accentColors.primary
  return (
    <div className="card" style={{
      padding: 'var(--space-md) var(--space-lg)',
      borderLeft: `3px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <span className="text-caption">{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={colors.icon} />
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
        color: 'var(--color-ink)', letterSpacing: 'var(--tracking-display)', lineHeight: 1.1,
      }}>
        {loading ? <div className="skeleton" style={{ width: 80, height: 28 }} /> : value}
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title }: {
  href: string; icon: React.ComponentType<{ size?: number; color?: string }>; title: string;
}) {
  return (
    <Link href={href} className="card card-hover" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-sm)', textDecoration: 'none', outline: 'none',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
        background: 'var(--color-accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color="var(--color-accent)" />
      </div>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 600,
        color: 'var(--color-ink)', flex: 1,
      }}>{title}</span>
      <ArrowUpRight size={14} color="var(--color-ink-3)" />
    </Link>
  )
}
