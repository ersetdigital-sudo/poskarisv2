'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface LaporanData {
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biayaOperasional: number
  labaBersih: number
  totalTransaksiServis: number
  totalTransaksiUnit: number
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData>({
    omzetServis: 0,
    omzetPenjualan: 0,
    marginUnit: 0,
    biayaOperasional: 0,
    labaBersih: 0,
    totalTransaksiServis: 0,
    totalTransaksiUnit: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  })

  useEffect(() => {
    fetchLaporan()
  }, [filterMonth])

  async function fetchLaporan() {
    setLoading(true)
    try {
      const startDate = new Date(filterMonth.year, filterMonth.month - 1, 1).toISOString()
      const endDate = new Date(filterMonth.year, filterMonth.month, 0, 23, 59, 59).toISOString()

      // Servis bulan ini
      const { data: servisData } = await supabase
        .from('services')
        .select('total_fee')
        .eq('status', 'selesai')
        .gte('date_in', startDate)
        .lte('date_in', endDate)

      const omzetServis = servisData?.reduce((sum, s) => sum + s.total_fee, 0) || 0

      // Penjualan unit bulan ini
      const { data: salesData } = await supabase
        .from('sales')
        .select('sell_price, buy_price, margin')
        .eq('status', 'completed')
        .gte('date', startDate)
        .lte('date', endDate)

      const omzetPenjualan = salesData?.reduce((sum, s) => sum + s.sell_price, 0) || 0
      const marginUnit = salesData?.reduce((sum, s) => sum + (s.margin || s.sell_price - s.buy_price), 0) || 0

      // Biaya operasional
      const { data: costData } = await supabase
        .from('operational_costs')
        .select('amount')
        .eq('period_month', filterMonth.month)
        .eq('period_year', filterMonth.year)

      const biayaOperasional = costData?.reduce((sum, c) => sum + c.amount, 0) || 0

      const labaBersih = (omzetServis + marginUnit) - biayaOperasional

      setData({
        omzetServis,
        omzetPenjualan,
        marginUnit,
        biayaOperasional,
        labaBersih,
        totalTransaksiServis: servisData?.length || 0,
        totalTransaksiUnit: salesData?.length || 0,
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-sm text-gray-500">Laporan keuangan bulanan</p>
      </div>

      {/* Filter Bulan */}
      <div className="mb-6 flex gap-3">
        <select
          value={filterMonth.month}
          onChange={(e) => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={filterMonth.year}
          onChange={(e) => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Omzet Servis</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatRupiah(data.omzetServis)}</p>
              <p className="mt-1 text-xs text-gray-400">{data.totalTransaksiServis} transaksi</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Omzet Penjualan Unit</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatRupiah(data.omzetPenjualan)}</p>
              <p className="mt-1 text-xs text-gray-400">{data.totalTransaksiUnit} unit terjual</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Biaya Operasional</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatRupiah(data.biayaOperasional)}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2.5">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Laba Bersih</p>
              <p className={`mt-1 text-2xl font-bold ${data.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatRupiah(data.labaBersih)}
              </p>
            </div>
            <div className={`rounded-lg p-2.5 ${data.labaBersih >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={`h-6 w-6 ${data.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Detail Rincian */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Rincian Laba Rugi - {months[filterMonth.month - 1]} {filterMonth.year}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-600">(+) Omzet Servis</span>
            <span className="font-medium text-blue-600">{formatRupiah(data.omzetServis)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-600">(+) Margin Penjualan Unit</span>
            <span className="font-medium text-green-600">{formatRupiah(data.marginUnit)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-600">(-) Biaya Operasional</span>
            <span className="font-medium text-red-600">-{formatRupiah(data.biayaOperasional)}</span>
          </div>
          <div className="flex justify-between pt-3 text-base">
            <span className="font-bold text-gray-900">= Laba Bersih</span>
            <span className={`font-bold text-lg ${data.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(data.labaBersih)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
