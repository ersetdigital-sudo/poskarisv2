'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchFinanceData } from '@/lib/finance'
import { Wrench, TrendingUp, DollarSign } from 'lucide-react'

import PageHeader from '@/components/dashboard/PageHeader'
import MonthPicker from '@/components/dashboard/MonthPicker'
import StatCard from '@/components/dashboard/StatCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import CategoryChart from '@/components/dashboard/CategoryChart'
import TopProducts from '@/components/dashboard/TopProducts'
import TopCustomers from '@/components/dashboard/TopCustomers'
import RecentTransactions from '@/components/dashboard/RecentTransactions'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

interface DashboardStats {
  totalServis: number
  totalOmzet: number
  totalProfit: number
  totalBiaya: number
  unitTerjual: number
  sparepartDigunakan: number
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const params = useSearchParams()
  const month = params?.get('m') ?? 'all'
  const year = params?.get('y') ?? String(new Date().getFullYear())
  
  const [stats, setStats] = useState<DashboardStats>({ 
    totalServis: 0, totalOmzet: 0, totalProfit: 0, 
    totalBiaya: 0, unitTerjual: 0, sparepartDigunakan: 0 
  })
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [marketplaceData, setMarketplaceData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => { fetchAll() }, [month, year])

  async function fetchAll() {
    try {
      const yearNum = Number(year)
      // MonthPicker mengirim index 0-based (0=Januari), helper finance.ts memakai bulan 1-based (1=Januari)
      const monthNum = month === 'all' ? null : Number(month) + 1

      const { summary, services, sales } = await fetchFinanceData({ year: yearNum, month: monthNum })

      // sparepart_cost/sparepart_used belum ada di DB — 0 sampai fitur pemakaian sparepart dibangun
      const sparepartDigunakan = 0

      setStats({
        totalServis: services.length,
        totalOmzet: summary.omzetServis + summary.omzetPenjualan,
        totalProfit: summary.labaBersih,
        totalBiaya: 0,
        unitTerjual: summary.totalTransaksiUnit,
        sparepartDigunakan,
      })

      // Monthly chart data (12 bulan, dari satu sumber formula laba)
      const monthly = summary.monthly.map((m) => ({
        name: MONTHS[m.month - 1].slice(0, 3),
        omzet: m.omzetServis + m.omzetPenjualan,
        profit: m.laba,
        biaya: m.biaya,
      }))
      setMonthlyData(monthly)

      // Category breakdown (Servis vs Unit) — profit dari status selesai/completed saja
      const grossProfit = summary.omzetServis + summary.marginUnit
      setCategoryData([
        {
          name: 'Servis',
          value: Math.round(summary.omzetServis),
          pct: grossProfit > 0 ? Math.round((summary.omzetServis / grossProfit) * 100) : 0,
        },
        {
          name: 'Unit Laptop',
          value: Math.round(summary.marginUnit),
          pct: grossProfit > 0 ? Math.round((summary.marginUnit / grossProfit) * 100) : 0,
        },
      ])

      // Marketplace placeholder (can be customized based on your data)
      setMarketplaceData([
        { name: 'Walk-in', value: Math.round(summary.labaBersih * 0.6), pct: 60 },
        { name: 'Online', value: Math.round(summary.labaBersih * 0.4), pct: 40 }
      ])
      
      // Top products by quantity
      const productMap: Record<string, { qty: number; revenue: number; category: string }> = {}
      sales.forEach(s => {
        const prodName = s.product_id || 'Unknown'
        if (!productMap[prodName]) productMap[prodName] = { qty: 0, revenue: 0, category: 'Unit' }
        productMap[prodName].qty += 1
        productMap[prodName].revenue += s.sell_price || 0
      })
      const topProds = Object.entries(productMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.qty - a.qty)
      setTopProducts(topProds)
      
      // Top customers
      const customerMap: Record<string, { total: number; count: number }> = {}
      services.forEach(s => {
        const name = s.customer_name || 'Unknown'
        if (!customerMap[name]) customerMap[name] = { total: 0, count: 0 }
        customerMap[name].total += s.total_fee || 0
        customerMap[name].count += 1
      })
      sales.forEach(s => {
        const name = s.buyer_name || 'Unknown'
        if (!customerMap[name]) customerMap[name] = { total: 0, count: 0 }
        customerMap[name].total += s.sell_price || 0
        customerMap[name].count += 1
      })
      const topCust = Object.entries(customerMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
      setTopCustomers(topCust)
      
      // Recent transactions
      const recent = [
        ...services.map(s => ({
          id: s.id,
          type: 'servis' as const,
          title: `Servis ${s.nota_number}`,
          subtitle: `${s.customer_name} · ${s.device_type}`,
          amount: s.total_fee || 0,
          date: s.created_at,
          status: s.status
        })),
        ...sales.map(s => ({
          id: s.id,
          type: 'sale' as const,
          title: `Penjualan Unit`,
          subtitle: s.buyer_name || 'Customer',
          amount: s.sell_price || 0,
          date: s.created_at,
          status: s.status
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentTransactions(recent)
      
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const periodLabel = month === 'all' 
    ? `Kumulatif Tahun ${year}` 
    : `${MONTHS[Number(month)]} ${year}`

  return (
    <div className="space-y-3">
      <PageHeader
        title="Dashboard POS"
        subtitle={isAdmin ? `Ringkasan bisnis toko laptop — ${periodLabel}` : 'Ringkasan aktivitas hari ini'}
      >
        {isAdmin && <MonthPicker month={month} year={year} />}
      </PageHeader>

      {/* KPI Stats */}
      <div className={`grid grid-cols-1 gap-2.5 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <StatCard
          title="Total Servis"
          value={loading ? '...' : String(stats.totalServis)}
          sub={`${stats.sparepartDigunakan} sparepart digunakan`}
          icon={Wrench}
          color="primary"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Total Omzet"
              value={loading ? '...' : formatRupiah(stats.totalOmzet)}
              sub={`${stats.unitTerjual} unit terjual`}
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="Total Profit"
              value={loading ? '...' : formatRupiah(stats.totalProfit)}
              sub={stats.totalOmzet > 0 ? `${((stats.totalProfit / stats.totalOmzet) * 100).toFixed(1)}% margin` : 'Belum ada penjualan'}
              icon={TrendingUp}
              color={stats.totalProfit >= 0 ? 'emerald' : 'danger'}
              valueClass={stats.totalProfit >= 0 ? 'text-badge-success' : 'text-danger'}
            />
          </>
        )}
      </div>

      {/* Monthly Chart - Admin only */}
      {isAdmin && (
        <div>
          <RevenueChart
            data={monthlyData}
            title={`Tren Bulanan ${year}`}
            subtitle="Omzet dan profit per bulan"
          />
        </div>
      )}

      {/* Category & Marketplace Charts - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <CategoryChart
            data={categoryData}
            title="Profit per Kategori"
            subtitle="Servis vs Unit Laptop"
          />
          <CategoryChart
            data={marketplaceData}
            title="Profit per Channel"
            subtitle="Walk-in vs Online"
          />
        </div>
      )}

      {/* Top Products & Customers - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TopProducts items={topProducts} limit={5} />
          <TopCustomers items={topCustomers} limit={5} />
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <RecentTransactions items={recentTransactions} limit={8} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
