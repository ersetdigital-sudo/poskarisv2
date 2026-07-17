'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { Search, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react'

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showMovements, setShowMovements] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100),
      ])
      setProducts(prodRes.data || [])
      setMovements(movRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(p => {
    const catName = (p as Product & { categories?: { name: string } }).categories?.name || ''
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || catName === filterCategory
    return matchSearch && matchCategory
  })

  const lowStock = products.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0)
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

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
        <h1 className="text-2xl font-bold text-gray-900">Stok Barang</h1>
        <p className="text-sm text-gray-500">Kelola stok unit laptop dan sparepart</p>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Stok Menipis</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {p.name} ({p.quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama barang atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Semua Kategori</option>
          <option value="Unit Laptop">Unit Laptop</option>
          <option value="Sparepart">Sparepart</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Barang</th>
                <th className="px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="px-4 py-3 font-medium text-gray-600">Stok</th>
                <th className="px-4 py-3 font-medium text-gray-600">Harga Beli</th>
                <th className="px-4 py-3 font-medium text-gray-600">Harga Jual</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data stok
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
                  const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 cursor-pointer ${isLow ? 'bg-orange-50' : ''}`}
                      onClick={() => {
                        setSelectedProduct(p)
                        setShowMovements(true)
                      }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sku || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{catName}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                          {p.quantity}
                        </span>
                        {isLow && <AlertTriangle className="ml-1 inline h-3 w-3 text-orange-500" />}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatRupiah(p.buy_price)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatRupiah(p.sell_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          p.status === 'ready' ? 'bg-green-100 text-green-700' :
                          p.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Mutasi Stok */}
      {showMovements && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Mutasi Stok: {selectedProduct.name}
            </h2>
            <div className="mb-4 text-sm text-gray-600">
              Stok saat ini: <span className="font-bold">{selectedProduct.quantity}</span>
            </div>
            <div className="space-y-2">
              {movements
                .filter(m => m.product_id === selectedProduct.id)
                .map(m => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-sm">
                    {m.type === 'masuk' ? (
                      <ArrowDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {m.type === 'masuk' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-xs text-gray-500">{m.notes || m.reference_type}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(m.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))}
              {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">Belum ada mutasi stok</p>
              )}
            </div>
            <button
              onClick={() => setShowMovements(false)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
