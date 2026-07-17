'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalServis: number; servisHariIni: number; unitReady: number; sparepartStok: number;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalServis:0, servisHariIni:0, unitReady:0, sparepartStok:0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const today = new Date(); today.setHours(0,0,0,0)
      const todayStr = today.toISOString()
      if (isAdmin) {
        const [s1, s2, s3, s4] = await Promise.all([
          supabase.from('services').select('id', { count:'exact' }),
          supabase.from('services').select('id', { count:'exact' }).gte('created_at', todayStr),
          supabase.from('products').select('id', { count:'exact' }).eq('status','ready'),
          supabase.from('products').select('quantity').eq('category_id', (await supabase.from('categories').select('id').eq('name','Sparepart').single()).data?.id || ''),
        ])
        setStats({ totalServis: s1.count||0, servisHariIni: s2.count||0, unitReady: s3.count||0, sparepartStok: s4.data?.reduce((s,p)=>s+p.quantity,0)||0 })
      } else {
        const [s1, s2] = await Promise.all([
          supabase.from('services').select('id', { count:'exact' }),
          supabase.from('services').select('id', { count:'exact' }).gte('created_at', todayStr),
        ])
        setStats({ totalServis: s1.count||0, servisHariIni: s2.count||0, unitReady: 0, sparepartStok: 0 })
      }
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div style={{ maxWidth:1040 }}>
      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <Zap size={20} style={{ color:'var(--primary)' }} />
          <h1 style={{ fontSize:28, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.56px' }}>
            {profile?.name ? `Halo, ${profile.name.split(' ')[0]}.` : 'Dashboard'}
          </h1>
        </div>
        <p style={{ fontSize:14, color:'var(--mute)', marginLeft:30 }}>{dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:36 }}>
        <StatCard label="Total Servis" value={stats.totalServis} icon={Wrench} loading={loading}
          gradient="linear-gradient(135deg, #635bff 0%, #a78bfa 100%)" iconBg="rgba(255,255,255,0.2)" />
        {isAdmin && <>
          <StatCard label="Unit Ready" value={stats.unitReady} icon={Laptop} loading={loading}
            gradient="linear-gradient(135deg, #00d4aa 0%, #34d399 100%)" iconBg="rgba(255,255,255,0.2)" />
          <StatCard label="Sparepart Stok" value={stats.sparepartStok} icon={Package} loading={loading}
            gradient="linear-gradient(135deg, #f5a623 0%, #fbbf24 100%)" iconBg="rgba(255,255,255,0.2)" />
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading}
            gradient="linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)" iconBg="rgba(255,255,255,0.15)" />
        </>}
        {!isAdmin && (
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading}
            gradient="linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)" iconBg="rgba(255,255,255,0.15)" />
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontSize:16, fontWeight:600, color:'var(--ink)', marginBottom:16, letterSpacing:'-0.02em' }}>Aksi Cepat</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 }}>
          <QuickAction href="/servis" icon={Wrench} title="Input Servis Baru" description="Catat servis masuk dari pelanggan" />
          {isAdmin && <>
            <QuickAction href="/unit-laptop/beli" icon={Laptop} title="Tambah Unit Laptop" description="Tambah unit baru ke stok pembelian" />
            <QuickAction href="/laporan" icon={TrendingUp} title="Lihat Laporan" description="Cek laporan keuangan bulanan" />
          </>}
          {!isAdmin && <QuickAction href="/servis" icon={Wrench} title="Daftar Servis" description="Lihat semua order servis berjalan" />}
        </div>
      </div>

      {/* System Status */}
      <div className="card" style={{ padding:24 }}>
        <h2 style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:16 }}>Status Sistem</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:16 }}>
          <StatusItem label="Versi" value="v2.0" />
          <StatusItem label="Mode" value={profile?.role === 'admin' ? 'Admin' : 'Karyawan'} />
          <StatusItem label="Status" value="Online" color="var(--success-text)" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, loading, gradient, iconBg }: {
  label: string; value: number; icon: React.ComponentType<{ size?: number; color?: string }>;
  loading: boolean; gradient: string; iconBg: string;
}) {
  return (
    <div style={{
      background: gradient, borderRadius:14, padding:22,
      color:'#fff', position:'relative', overflow:'hidden',
      boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {/* Subtle shine */}
      <div style={{
        position:'absolute', top:0, right:0, width:120, height:120,
        borderRadius:'50%', background:'rgba(255,255,255,0.08)',
        transform:'translate(30%,-30%)', pointerEvents:'none',
      }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
        <span style={{ fontSize:13, fontWeight:500, opacity:0.85 }}>{label}</span>
        <div style={{
          width:36, height:36, borderRadius:10, background:iconBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(4px)',
        }}>
          <Icon size={18} color="#fff" />
        </div>
      </div>
      <div style={{ fontSize:36, fontWeight:300, lineHeight:1, letterSpacing:'-0.72px', position:'relative' }}>
        {loading ? <div style={{ width:60, height:36, background:'rgba(255,255,255,0.15)', borderRadius:6 }} /> : value}
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title, description }: {
  href: string; icon: React.ComponentType<{ size?: number; color?: string }>; title: string; description: string;
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={href} className="card card-interactive"
      style={{ display:'flex', alignItems:'center', gap:16, padding:18, textDecoration:'none',
        borderColor: hovered ? 'rgba(99,91,255,0.2)' : 'var(--hairline)' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width:44, height:44, borderRadius:12,
        background: hovered ? 'rgba(99,91,255,0.1)' : 'var(--background)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        transition:'background 200ms ease',
      }}>
        <Icon size={20} color={hovered ? 'var(--primary)' : 'var(--mute)'} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>{title}</p>
        <p style={{ fontSize:13, color:'var(--mute)' }}>{description}</p>
      </div>
      <ArrowRight size={16} style={{ color: hovered ? 'var(--primary)' : 'var(--stone)', transition:'color 200ms ease', flexShrink:0 }} />
    </Link>
  )
}

function StatusItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize:12, color:'var(--mute)', marginBottom:2 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:600, color: color || 'var(--ink)' }}>{value}</p>
    </div>
  )
}
