'use client'

import { useEffect, useState } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { Plus, Search, ShoppingCart, ArrowDownToLine } from 'lucide-react'
import Link from 'next/link'

export default function UnitLaptopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Unit Laptop')
        .single()

      if (!cat) return

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.model || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const statusBadge: Record<string, string> = {
    ready: 'bg-green-100 text-green-700',
    sold: 'bg-blue-100 text-blue-700',
    reserved: 'bg-yellow-100 text-yellow-700',
    repairing: 'bg-orange-100 text-orange-700',
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unit Laptop</h1>
          <p className="text-sm text-gray-500">Kelola stok unit laptop</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/unit-laptop/beli"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Beli Unit
          </Link>
          <Link
            href="/unit-laptop/jual"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Jual Unit
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari merk, tipe, atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="ready">Ready</option>
          <option value="sold">Terjual</option>
          <option value="reserved">Reserved</option>
          <option value="repairing">Repairing</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Unit</th>
                <th className="px-4 py-3 font-medium text-gray-600">Spesifikasi</th>
                <th className="px-4 py-3 font-medium text-gray-600">Kondisi</th>
                <th className="px-4 py-3 font-medium text-gray-600">Harga Beli</th>
                <th className="px-4 py-3 font-medium text-gray-600">Harga Jual</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada unit laptop
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{p.brand} {p.model}</p>
                        <p className="text-xs text-gray-500">{p.sku || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{p.specs || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700">{p.condition || '-'}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatRupiah(p.buy_price)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatRupiah(p.sell_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
