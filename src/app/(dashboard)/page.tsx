'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp, ArrowRight } from 'lucide-react'
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
    <div>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 className="text-h1" style={{ marginBottom:4 }}>
          {profile?.name ? `Halo, ${profile.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-small" style={{ color:'var(--mute)' }}>{dateStr} · {isAdmin ? 'Admin' : 'Karyawan'}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 }}>
        <StatCard label="Total Servis" value={stats.totalServis} icon={Wrench} loading={loading} />
        {isAdmin && <>
          <StatCard label="Unit Ready" value={stats.unitReady} icon={Laptop} loading={loading} />
          <StatCard label="Sparepart Stok" value={stats.sparepartStok} icon={Package} loading={loading} />
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} />
        </>}
        {!isAdmin && (
          <StatCard label="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} loading={loading} />
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom:32 }}>
        <h2 className="text-h3" style={{ marginBottom:16 }}>Aksi Cepat</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
          <QuickAction href="/servis" icon={Wrench} title="Input Servis Baru" description="Catat servis masuk" />
          {isAdmin && <>
            <QuickAction href="/unit-laptop/beli" icon={Laptop} title="Beli Unit Laptop" description="Tambah unit ke stok" />
            <QuickAction href="/laporan" icon={TrendingUp} title="Lihat Laporan" description="Cek keuangan bulanan" />
          </>}
          {!isAdmin && <QuickAction href="/servis" icon={Wrench} title="Daftar Servis" description="Lihat order berjalan" />}
        </div>
      </div>

      {/* System Status */}
      <div className="card" style={{ padding:20 }}>
        <h3 className="text-h3" style={{ marginBottom:16 }}>Status Sistem</h3>
        <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
          <StatusItem label="Versi" value="v2.0" />
          <StatusItem label="Mode" value={profile?.role === 'admin' ? 'Admin' : 'Karyawan'} />
          <StatusItem label="Status" value="● Online" color="var(--success)" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, loading }: {
  label: string; value: number; icon: React.ComponentType<{ size?: number; color?: string }>; loading: boolean;
}) {
  return (
    <div className="card card-hover" style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <span className="text-caption">{label}</span>
        <Icon size={16} color="var(--subtle)" />
      </div>
      <div className="text-h1" style={{ fontSize:28, fontWeight:600 }}>
        {loading ? <div className="skeleton" style={{ width:60, height:28 }} /> : value}
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title, description }: {
  href: string; icon: React.ComponentType<{ size?: number; color?: string }>; title: string; description: string;
}) {
  return (
    <Link href={href} className="card card-hover" style={{ display:'flex', alignItems:'center', gap:12, padding:14, textDecoration:'none' }}>
      <div style={{
        width:36, height:36, borderRadius:8, background:'var(--surface-muted)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <Icon size={18} color="var(--mute)" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:500, color:'var(--ink)', marginBottom:2 }}>{title}</p>
        <p style={{ fontSize:12, color:'var(--mute)' }}>{description}</p>
      </div>
      <ArrowRight size={14} color="var(--subtle)" />
    </Link>
  )
}

function StatusItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-caption" style={{ marginBottom:2 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:500, color: color || 'var(--ink)' }}>{value}</p>
    </div>
  )
}
