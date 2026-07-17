'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  ink:       '#15181C',
  graphite:  '#2A2F36',
  paper:     '#ECEDE7',
  paperBright: '#F5F4F0',
  copper:    '#C6763B',
  copperDim: 'rgba(198,118,59,0.12)',
  signal:    '#4FAE7C',
  signalDim: 'rgba(79,174,124,0.12)',
  inkText:   '#1B1D1F',
  inkMuted:  '#6B7076',
  border:    '#D8D9D4',
  mono:      'var(--font-jetbrains-mono), monospace',
  sans:      'var(--font-geist-sans), sans-serif',
} as const

interface DashboardStats {
  totalServis:    number
  servisHariIni: number
  unitReady:      number
  sparepartStok:  number
}

// ─── Dotted leader helper ─────────────────────────────────────────────────────
// Renders:  LABEL ···················· VALUE
function ReceiptRow({
  label,
  value,
  valueColor,
  accent,
}: {
  label: string
  value: string | number
  valueColor?: string
  accent?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 0' }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          fontWeight: 600,
          color: accent ? T.copper : T.inkMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {/* dotted leader */}
      <span
        style={{
          flex: 1,
          borderBottom: `1px dashed ${T.border}`,
          marginBottom: 3,
          minWidth: 24,
        }}
      />
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 13,
          fontWeight: 700,
          color: valueColor ?? T.inkText,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 600,
        color: T.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  )
}

// ─── Stat tile — used inside the receipt strip ────────────────────────────────
function StatTile({
  label,
  value,
  icon: Icon,
  loading,
  last,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ size?: number; color?: string }>
  loading: boolean
  last?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '18px 20px',
        borderRight: last ? 'none' : `1px dashed ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            fontWeight: 600,
            color: T.inkMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
          }}
        >
          {label}
        </span>
        <Icon size={14} color={T.copper} />
      </div>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 28,
          fontWeight: 700,
          color: T.inkText,
          lineHeight: 1,
        }}
      >
        {loading ? '—' : value}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
    <div style={{ maxWidth: 900 }}>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: T.mono,
            fontSize: 20,
            fontWeight: 700,
            color: T.inkText,
            letterSpacing: '0.04em',
            marginBottom: 4,
          }}
        >
          {profile?.name
            ? `Halo, ${profile.name.split(' ')[0]}.`
            : 'Dashboard'}
        </h1>
        <p style={{ fontFamily: T.sans, fontSize: 13, color: T.inkMuted }}>
          {dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}
        </p>
      </div>

      {/* ── STRUK STRIP — horizontal metrics ──────────────────────────────── */}
      {/*
        One strip like a receipt header — divided by vertical dashed lines.
        No separate cards, no shadows.
      */}
      <div
        style={{
          background: T.paperBright,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: 32,
          overflow: 'hidden',
        }}
      >
        {/* Top label bar */}
        <div
          style={{
            width: '100%',
            padding: '8px 20px',
            borderBottom: `1px dashed ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Ringkasan Hari Ini
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.copper, letterSpacing: '0.12em' }}>
            ● LIVE
          </span>
        </div>

        {/* Tiles */}
        <StatTile label="Total Servis"    value={stats.totalServis}    icon={Wrench}    loading={loading} />
        {isAdmin && (
          <>
            <StatTile label="Unit Ready"      value={stats.unitReady}      icon={Laptop}    loading={loading} />
            <StatTile label="Sparepart Stok"  value={stats.sparepartStok}  icon={Package}   loading={loading} />
            <StatTile label="Servis Hari Ini" value={stats.servisHariIni}  icon={TrendingUp} loading={loading} last />
          </>
        )}
        {!isAdmin && (
          <StatTile label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} last />
        )}

        {/* Bottom footer — receipt style */}
        <div
          style={{
            width: '100%',
            padding: '6px 20px',
            borderTop: `1px dashed ${T.border}`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: T.mono, fontSize: 9, color: '#C8C9C4', letterSpacing: '0.2em' }}>
            * * * DATA DIPERBARUI OTOMATIS * * *
          </span>
        </div>
      </div>

      {/* ── AKSI CEPAT ────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Aksi Cepat</SectionLabel>

        <div
          style={{
            background: T.paperBright,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Input Servis Baru */}
          <QuickActionRow
            href="/servis"
            icon={Wrench}
            title="Input Servis Baru"
            description="Catat servis masuk dari pelanggan"
            first
          />

          {isAdmin && (
            <>
              <QuickActionRow
                href="/unit-laptop/beli"
                icon={Laptop}
                title="Tambah Unit Laptop"
                description="Tambah unit baru ke stok pembelian"
              />
              <QuickActionRow
                href="/laporan"
                icon={TrendingUp}
                title="Lihat Laporan"
                description="Cek laporan keuangan bulanan"
                last
              />
            </>
          )}

          {!isAdmin && (
            <QuickActionRow
              href="/servis"
              icon={Wrench}
              title="Daftar Servis"
              description="Lihat semua order servis berjalan"
              last
            />
          )}
        </div>
      </div>

      {/* ── STATUS NOTA ── small receipt-style info box ────────────────────── */}
      <div
        style={{
          marginTop: 28,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          background: T.paperBright,
          padding: '16px 20px',
        }}
      >
        <SectionLabel>Status Sistem</SectionLabel>
        <ReceiptRow label="Kasir POS"     value="v2.0"        valueColor={T.copper} />
        <ReceiptRow label="Mode"          value={profile?.role === 'admin' ? 'Admin' : 'Karyawan'} />
        <ReceiptRow label="Status"        value="● Online"    valueColor={T.signal} accent />
      </div>

    </div>
  )
}

// ─── Quick action row — receipt list style ────────────────────────────────────
function QuickActionRow({
  href,
  icon: Icon,
  title,
  description,
  first,
  last,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  title: string
  description: string
  first?: boolean
  last?: boolean
}) {
  const T2 = {
    border: '#D8D9D4',
    copper: '#C6763B',
    inkText: '#1B1D1F',
    inkMuted: '#6B7076',
    sans: 'var(--font-geist-sans), sans-serif',
    mono: 'var(--font-jetbrains-mono), monospace',
  }

  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        borderTop: first ? 'none' : `1px dashed ${T2.border}`,
        textDecoration: 'none',
        background: hovered ? 'rgba(198,118,59,0.05)' : 'transparent',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon pip */}
      <div
        style={{
          width: 32, height: 32, borderRadius: 4,
          background: hovered ? 'rgba(198,118,59,0.15)' : 'rgba(198,118,59,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.12s ease',
        }}
      >
        <Icon size={15} color={T2.copper} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: T2.sans, fontSize: 13, fontWeight: 600, color: T2.inkText, marginBottom: 1 }}>
          {title}
        </p>
        <p style={{ fontFamily: T2.sans, fontSize: 12, color: T2.inkMuted }}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <span style={{ fontFamily: T2.mono, fontSize: 12, color: hovered ? T2.copper : T2.border, transition: 'color 0.12s ease' }}>
        →
      </span>
    </Link>
  )
}
