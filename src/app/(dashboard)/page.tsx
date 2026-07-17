'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Laptop, Package, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalServis: number
  servisHariIni: number
  unitReady: number
  sparepartStok: number
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalServis: 0,
    servisHariIni: 0,
    unitReady: 0,
    sparepartStok: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      if (isAdmin) {
        const [servisRes, servisTodayRes, unitRes, sparepartRes] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
          supabase.from('products').select('id', { count: 'exact' }).eq('status', 'ready'),
          supabase.from('products').select('quantity').eq('category_id', (await supabase.from('categories').select('id').eq('name', 'Sparepart').single()).data?.id || ''),
        ])

        const totalSparepart = sparepartRes.data?.reduce((sum, p) => sum + p.quantity, 0) || 0

        setStats({
          totalServis: servisRes.count || 0,
          servisHariIni: servisTodayRes.count || 0,
          unitReady: unitRes.count || 0,
          sparepartStok: totalSparepart,
        })
      } else {
        const [servisRes, servisTodayRes] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact' }),
          supabase.from('services').select('id', { count: 'exact' }).gte('created_at', todayStr),
        ])

        setStats({
          totalServis: servisRes.count || 0,
          servisHariIni: servisTodayRes.count || 0,
          unitReady: 0,
          sparepartStok: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {profile?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? 'Kelola toko laptop Anda dari sini' : 'Kelola servis pelanggan dari sini'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Servis" value={stats.totalServis} icon={Wrench} color="blue" />
        {isAdmin && (
          <>
            <StatCard title="Unit Ready" value={stats.unitReady} icon={Laptop} color="green" />
            <StatCard title="Sparepart Stok" value={stats.sparepartStok} icon={Package} color="orange" />
            <StatCard title="Servis Hari Ini" value={stats.servisHariIni} icon={TrendingUp} color="purple" />
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/servis" title="Input Servis Baru" description="Catat servis masuk dari pelanggan" icon={Wrench} />
          {isAdmin && (
            <>
              <QuickAction href="/unit-laptop/beli" title="Tambah Unit" description="Tambah unit laptop baru ke stok" icon={Laptop} />
              <QuickAction href="/laporan" title="Lihat Laporan" description="Cek laporan harian & bulanan" icon={TrendingUp} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, title, description, icon: Icon }: {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
    >
      <div className="rounded-lg bg-blue-100 p-2">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  )
}
