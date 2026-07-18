'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalServis: number; servisHariIni: number; unitReady: number; sparepartStok: number;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalServis: 0, servisHariIni: 0, unitReady: 0, sparepartStok: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()
      if (isAdmin) {
        const [s1, s2, s3, s4] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
          supabase.from('products').select('id', { count: 'exact' }).eq('status', 'ready'),
          supabase.from('products').select('quantity').eq('category_id', (await supabase.from('categories').select('id').eq('name', 'Sparepart').single()).data?.id || ''),
        ])
        setStats({ totalServis: s1.count || 0, servisHariIni: s2.count || 0, unitReady: s3.count || 0, sparepartStok: s4.data?.reduce((s, p) => s + p.quantity, 0) || 0 })
      } else {
        const [s1, s2] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
        ])
        setStats({ totalServis: s1.count || 0, servisHariIni: s2.count || 0, unitReady: 0, sparepartStok: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Hero greeting bar */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-accent), oklch(45% 0.2 290))',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl) var(--space-2xl)',
        marginBottom: 'var(--space-xl)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 180, height: 180,
          borderRadius: '50%', background: 'oklch(100% 0 0 / 0.08)',
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -40, width: 120, height: 120,
          borderRadius: '50%', background: 'oklch(100% 0 0 / 0.05)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', fontWeight: 700,
            color: '#fff', letterSpacing: 'var(--tracking-display)', marginBottom: 6,
          }}>
            {profile?.name ? `Halo, ${profile.name.split(' ')[0]} 👋` : 'Dashboard'}
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: 'oklch(90% 0.02 275)', fontWeight: 400 }}>
            {dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)',
      }}>
        <StatCard label="Total Servis" value={stats.totalServis} icon={Wrench} loading={loading} accent="primary" />
        {isAdmin && <>
          <StatCard label="Unit Ready" value={stats.unitReady} icon={Laptop} loading={loading} accent="success" />
          <StatCard label="Sparepart Stok" value={stats.sparepartStok} icon={Package} loading={loading} accent="warning" />
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} accent="info" />
        </>}
        {!isAdmin && (
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} accent="info" />
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 className="text-h3" style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-ink-3)', fontWeight: 500, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Aksi Cepat</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-xs)',
        }}>
          <QuickAction href="/servis" icon={Wrench} title="Input Servis Baru" description="Catat servis masuk" />
          {isAdmin && <>
            <QuickAction href="/unit-laptop/beli" icon={Laptop} title="Beli Unit Laptop" description="Tambah unit ke stok" />
            <QuickAction href="/laporan" icon={TrendingUp} title="Lihat Laporan" description="Cek keuangan bulanan" />
          </>}
          {!isAdmin && <QuickAction href="/servis" icon={Wrench} title="Daftar Servis" description="Lihat order berjalan" />}
        </div>
      </div>

      {/* System Status */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>Status Sistem</h3>
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <StatusItem label="Versi" value="v2.0" />
          <StatusItem label="Mode" value={profile?.role === 'admin' ? 'Admin' : 'Karyawan'} />
          <StatusItem label="Status" value="Online" color="var(--color-success)" />
        </div>
      </div>
    </div>
  )
}

const accentColors: Record<string, { bg: string; icon: string; border: string }> = {
  primary: { bg: 'var(--color-accent-soft)', icon: 'var(--color-accent)', border: 'oklch(54% 0.24 275 / 0.2)' },
  success: { bg: 'var(--color-success-bg)', icon: 'var(--color-success)', border: 'oklch(62% 0.18 155 / 0.2)' },
  warning: { bg: 'var(--color-warning-bg)', icon: 'var(--color-warning)', border: 'oklch(72% 0.16 75 / 0.2)' },
  info:    { bg: 'var(--color-info-bg)', icon: 'var(--color-accent)', border: 'oklch(54% 0.24 275 / 0.2)' },
}

function StatCard({ label, value, icon: Icon, loading, accent = 'primary' }: {
  label: string; value: number; icon: React.ComponentType<{ size?: number; color?: string }>; loading: boolean; accent?: string;
}) {
  const colors = accentColors[accent] || accentColors.primary
  return (
    <div className="card" style={{
      padding: 'var(--space-lg)',
      borderLeft: `3px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <span className="text-caption">{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={colors.icon} />
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
        color: 'var(--color-ink)', letterSpacing: 'var(--tracking-display)', lineHeight: 1,
      }}>
        {loading ? <div className="skeleton" style={{ width: 60, height: 32 }} /> : value}
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title, description }: {
  href: string; icon: React.ComponentType<{ size?: number; color?: string }>; title: string; description: string;
}) {
  return (
    <Link href={href} className="card card-hover" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
      padding: 'var(--space-sm) var(--space-md)', textDecoration: 'none', outline: 'none',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)',
        background: 'var(--color-accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color="var(--color-accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)', fontWeight: 600,
          color: 'var(--color-ink)', marginBottom: 2,
        }}>{title}</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{description}</p>
      </div>
      <ArrowUpRight size={16} color="var(--color-ink-3)" />
    </Link>
  )
}

function StatusItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-caption" style={{ marginBottom: 2 }}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)', fontWeight: 600,
        color: color || 'var(--color-ink)',
      }}>{value}</p>
    </div>
  )
}
