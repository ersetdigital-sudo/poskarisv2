'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalServis:    number
  servisHariIni: number
  unitReady:      number
  sparepartStok:  number
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalServis: 0, servisHariIni: 0, unitReady: 0, sparepartStok: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStats() {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      if (isAdmin) {
        const [servisRes, servisTodayRes, unitRes, sparepartRes] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
          supabase.from('products').select('id', { count: 'exact' }).eq('status', 'ready'),
          supabase.from('products')
            .select('quantity')
            .eq('category_id',
              (await supabase.from('categories').select('id').eq('name', 'Sparepart').single()).data?.id || ''),
        ])
        setStats({
          totalServis:    servisRes.count || 0,
          servisHariIni: servisTodayRes.count || 0,
          unitReady:      unitRes.count || 0,
          sparepartStok:  sparepartRes.data?.reduce((s, p) => s + p.quantity, 0) || 0,
        })
      } else {
        const [servisRes, servisTodayRes] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
        ])
        setStats({ totalServis: servisRes.count || 0, servisHariIni: servisTodayRes.count || 0, unitReady: 0, sparepartStok: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 300,
          color: 'var(--ink)',
          letterSpacing: '-0.64px',
          lineHeight: 1.1,
          marginBottom: 4,
        }}>
          {profile?.name
            ? `Halo, ${profile.name.split(' ')[0]}.`
            : 'Dashboard'}
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--mute)' }}>
          {dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard
          label="Total Servis"
          value={stats.totalServis}
          icon={Wrench}
          loading={loading}
          color="var(--primary)"
          bgColor="rgba(83,58,253,0.08)"
        />
        {isAdmin && (
          <>
            <StatCard
              label="Unit Ready"
              value={stats.unitReady}
              icon={Laptop}
              loading={loading}
              color="#15be53"
              bgColor="rgba(21,190,83,0.08)"
            />
            <StatCard
              label="Sparepart Stok"
              value={stats.sparepartStok}
              icon={Package}
              loading={loading}
              color="#2874ad"
              bgColor="rgba(40,116,173,0.08)"
            />
            <StatCard
              label="Servis Hari Ini"
              value={stats.servisHariIni}
              icon={TrendingUp}
              loading={loading}
              color="#9b6829"
              bgColor="rgba(155,104,41,0.08)"
            />
          </>
        )}
        {!isAdmin && (
          <StatCard
            label="Servis Hari Ini"
            value={stats.servisHariIni}
            icon={TrendingUp}
            loading={loading}
            color="#9b6829"
            bgColor="rgba(155,104,41,0.08)"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}>
          Aksi Cepat
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}>
          <QuickActionCard
            href="/servis"
            icon={Wrench}
            title="Input Servis Baru"
            description="Catat servis masuk dari pelanggan"
          />
          {isAdmin && (
            <>
              <QuickActionCard
                href="/unit-laptop/beli"
                icon={Laptop}
                title="Tambah Unit Laptop"
                description="Tambah unit baru ke stok pembelian"
              />
              <QuickActionCard
                href="/laporan"
                icon={TrendingUp}
                title="Lihat Laporan"
                description="Cek laporan keuangan bulanan"
              />
            </>
          )}
          {!isAdmin && (
            <QuickActionCard
              href="/servis"
              icon={Wrench}
              title="Daftar Servis"
              description="Lihat semua order servis berjalan"
            />
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: 16,
        }}>
          Status Sistem
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatusRow label="Versi" value="Kasir POS v2.0" />
          <StatusRow label="Mode" value={profile?.role === 'admin' ? 'Admin' : 'Karyawan'} />
          <StatusRow label="Status" value="Online" valueColor="var(--success-text)" />
        </div>
      </div>
    </div>
  )
}

/* ── Stat Card ──────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  color,
  bgColor,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ size?: number; color?: string }>
  loading: boolean
  color: string
  bgColor: string
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--mute)', letterSpacing: '0.02em' }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32,
          borderRadius: 6,
          background: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 300,
        color: 'var(--ink)',
        lineHeight: 1,
        letterSpacing: '-0.56px',
      }}>
        {loading ? (
          <div className="skeleton" style={{ width: 48, height: 28 }} />
        ) : (
          value
        )}
      </div>
    </div>
  )
}

/* ── Quick Action Card ───────────────────────────── */
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  title: string
  description: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        textDecoration: 'none',
        borderColor: hovered ? 'var(--hairline-strong)' : 'var(--hairline)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 40, height: 40,
        borderRadius: 6,
        background: 'rgba(83,58,253,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color="var(--primary)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
          {title}
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--mute)' }}>
          {description}
        </p>
      </div>

      <ArrowRight size={16} style={{ color: hovered ? 'var(--primary)' : 'var(--hairline-strong)', transition: 'color 200ms ease', flexShrink: 0 }} />
    </Link>
  )
}

/* ── Status Row ──────────────────────────────────── */
function StatusRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--mute)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: valueColor || 'var(--ink)' }}>{value}</span>
    </div>
  )
}
