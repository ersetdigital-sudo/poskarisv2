'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, TrendingUp, DollarSign, ShoppingCart, Package, Receipt } from 'lucide-react'

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
      const monthNum = month === 'all' ? null : Number(month)
      
      // Fetch services & sales for the period
      let servicesQuery = supabase.from('services').select('*')
      let salesQuery = supabase.from('sales').select('*')
      
      // Filter by year
      servicesQuery = servicesQuery.gte('created_at', `${yearNum}-01-01`).lt('created_at', `${yearNum + 1}-01-01`)
      salesQuery = salesQuery.gte('created_at', `${yearNum}-01-01`).lt('created_at', `${yearNum + 1}-01-01`)
      
      // Filter by month if not 'all'
      if (monthNum !== null) {
        const monthStart = new Date(yearNum, monthNum, 1).toISOString()
        const monthEnd = new Date(yearNum, monthNum + 1, 1).toISOString()
        servicesQuery = servicesQuery.gte('created_at', monthStart).lt('created_at', monthEnd)
        salesQuery = salesQuery.gte('created_at', monthStart).lt('created_at', monthEnd)
      }
      
      const [servicesRes, salesRes, productsRes, stockRes] = await Promise.all([
        servicesQuery,
        salesQuery,
        supabase.from('products').select('*, categories(name)'),
        supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(50)
      ])
      
      const services = servicesRes.data || []
      const sales = salesRes.data || []
      const products = productsRes.data || []
      
      // Calculate stats
      const totalServis = services.length
      const totalOmzet = services.reduce((sum, s) => sum + (s.total_fee || 0), 0) + 
                         sales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
      const totalProfit = services.reduce((sum, s) => sum + (s.total_fee - (s.sparepart_cost || 0)), 0) +
                         sales.reduce((sum, s) => sum + ((s.sell_price || 0) - (s.buy_price || 0)), 0)
      const totalBiaya = services.reduce((sum, s) => sum + (s.sparepart_cost || 0), 0)
      const unitTerjual = sales.filter(s => s.status === 'completed').length
      const sparepartDigunakan = services.reduce((sum, s) => sum + (s.sparepart_used?.length || 0), 0)
      
      setStats({ totalServis, totalOmzet, totalProfit, totalBiaya, unitTerjual, sparepartDigunakan })
      
      // Monthly chart data (all 12 months for the year)
      const monthly = MONTHS.map((name, idx) => {
        const monthServices = services.filter(s => new Date(s.created_at).getMonth() === idx)
        const monthSales = sales.filter(s => new Date(s.created_at).getMonth() === idx)
        const omzet = monthServices.reduce((sum, s) => sum + (s.total_fee || 0), 0) +
                      monthSales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
        const profit = monthServices.reduce((sum, s) => sum + (s.total_fee - (s.sparepart_cost || 0)), 0) +
                       monthSales.reduce((sum, s) => sum + ((s.sell_price || 0) - (s.buy_price || 0)), 0)
        return { name: name.slice(0, 3), omzet, profit }
      })
      setMonthlyData(monthly)
      
      // Category breakdown (Servis vs Unit)
      const servisProfit = services.reduce((sum, s) => sum + (s.total_fee - (s.sparepart_cost || 0)), 0)
      const unitProfit = sales.reduce((sum, s) => sum + ((s.sell_price || 0) - (s.buy_price || 0)), 0)
      setCategoryData([
        { name: 'Servis', value: Math.round(servisProfit), pct: Math.round((servisProfit / totalProfit) * 100) || 0 },
        { name: 'Unit Laptop', value: Math.round(unitProfit), pct: Math.round((unitProfit / totalProfit) * 100) || 0 }
      ])
      
      // Marketplace placeholder (can be customized based on your data)
      setMarketplaceData([
        { name: 'Walk-in', value: Math.round(totalProfit * 0.6), pct: 60 },
        { name: 'Online', value: Math.round(totalProfit * 0.4), pct: 40 }
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
    ? `Tahun ${year}` 
    : `${MONTHS[Number(month)]} ${year}`

  return (
    <div className="space-y-3">
      <PageHeader
        title="Dashboard POS"
        subtitle={`Ringkasan bisnis toko laptop — ${periodLabel}`}
      >
        <MonthPicker month={month} year={year} />
      </PageHeader>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <StatCard
          title="Total Servis"
          value={loading ? '...' : String(stats.totalServis)}
          sub={`${stats.sparepartDigunakan} sparepart digunakan`}
          icon={Wrench}
          color="primary"
        />
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
      </div>

      {/* Monthly Chart */}
      <div>
        <RevenueChart
          data={monthlyData}
          title={`Tren Bulanan ${year}`}
          subtitle="Omzet dan profit per bulan"
        />
      </div>

      {/* Category & Marketplace Charts */}
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

      {/* Top Products & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopProducts items={topProducts} limit={5} />
        <TopCustomers items={topCustomers} limit={5} />
      </div>

      {/* Recent Transactions */}
      <div>
        <RecentTransactions items={recentTransactions} limit={8} />
      </div>
    </div>
  )
}
