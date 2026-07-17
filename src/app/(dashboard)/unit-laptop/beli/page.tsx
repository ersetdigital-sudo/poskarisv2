'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'

export default function BeliUnitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    brand: '',
    model: '',
    specs: '',
    condition: 'bekas' as 'baru' | 'bekas' | 'refurbished',
    imei_serial: '',
    buy_price: 0,
    sell_price: 0,
    source_type: 'supplier' as 'supplier' | 'customer',
    source_name: '',
    source_phone: '',
    notes: '',
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Unit Laptop')
        .single()

      if (!cat) throw new Error('Kategori tidak ditemukan')

      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          category_id: cat.id,
          name: `${form.brand} ${form.model}`,
          brand: form.brand,
          model: form.model,
          specs: form.specs || null,
          condition: form.condition,
          imei_serial: form.imei_serial || null,
          buy_price: form.buy_price,
          sell_price: form.sell_price,
          quantity: 1,
          status: 'ready',
        })
        .select()
        .single()

      if (productError) throw productError

      // Insert purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          product_id: product.id,
          source_type: form.source_type,
          source_name: form.source_name || null,
          source_phone: form.source_phone || null,
          buy_price: form.buy_price,
          notes: form.notes || null,
          created_by: user?.id,
        })

      if (purchaseError) throw purchaseError

      // Insert stock movement
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        type: 'masuk',
        quantity: 1,
        reference_type: 'pembelian_unit',
        reference_id: product.id,
        notes: `Pembelian unit ${form.brand} ${form.model}`,
        created_by: user?.id,
      })

      router.push('/unit-laptop')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beli Unit Laptop</h1>
          <p className="text-sm text-gray-500">Tambah unit laptop baru ke stok</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Merk *</label>
                <input
                  type="text"
                  required
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="ASUS, Lenovo, dll"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipe/Model *</label>
                <input
                  type="text"
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Spesifikasi</label>
              <textarea
                value={form.specs}
                onChange={(e) => setForm({ ...form, specs: e.target.value })}
                placeholder="RAM 8GB, SSD 256GB, i5-1135G7, dll"
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kondisi *</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="bekas">Bekas</option>
                  <option value="baru">Baru</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IMEI/SN</label>
                <input
                  type="text"
                  value={form.imei_serial}
                  onChange={(e) => setForm({ ...form, imei_serial: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga Beli (Rp) *</label>
                <input
                  type="number"
                  required
                  value={form.buy_price || ''}
                  onChange={(e) => setForm({ ...form, buy_price: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga Jual (Rp)</label>
                <input
                  type="number"
                  value={form.sell_price || ''}
                  onChange={(e) => setForm({ ...form, sell_price: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Potensi Margin: <span className="font-bold text-green-600">{formatRupiah(form.sell_price - form.buy_price)}</span>
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Sumber Pembelian</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipe</label>
                  <select
                    value={form.source_type}
                    onChange={(e) => setForm({ ...form, source_type: e.target.value as 'supplier' | 'customer' })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="supplier">Supplier</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    value={form.source_name}
                    onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">No. HP</label>
                  <input
                    type="text"
                    value={form.source_phone}
                    onChange={(e) => setForm({ ...form, source_phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pembelian'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
