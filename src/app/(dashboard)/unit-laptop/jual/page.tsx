'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'

export default function JualUnitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [units, setUnits] = useState<Product[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Product | null>(null)
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_phone: '',
    sell_price: 0,
    payment_method: 'tunai' as 'tunai' | 'transfer' | 'tempo',
    notes: '',
  })

  useEffect(() => {
    fetchUnits()
  }, [])

  async function fetchUnits() {
    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Unit Laptop')
        .single()

      if (!cat) return

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', cat.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })

      setUnits(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnit) {
      setError('Pilih unit terlebih dahulu')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Insert sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          product_id: selectedUnit.id,
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone || null,
          sell_price: form.sell_price,
          buy_price: selectedUnit.buy_price,
          payment_method: form.payment_method,
          notes: form.notes || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Update product status
      await supabase
        .from('products')
        .update({ status: 'sold', sell_price: form.sell_price })
        .eq('id', selectedUnit.id)

      // Insert stock movement
      await supabase.from('stock_movements').insert({
        product_id: selectedUnit.id,
        type: 'keluar',
        quantity: 1,
        reference_type: 'penjualan_unit',
        reference_id: sale.id,
        notes: `Penjualan unit ${selectedUnit.brand} ${selectedUnit.model} ke ${form.buyer_name}`,
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
          <h1 className="text-2xl font-bold text-gray-900">Jual Unit Laptop</h1>
          <p className="text-sm text-gray-500">Catat penjualan unit laptop</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Pilih Unit *</label>
              <select
                value={selectedUnit?.id || ''}
                onChange={(e) => {
                  const unit = units.find(u => u.id === e.target.value)
                  setSelectedUnit(unit || null)
                  if (unit) setForm({ ...form, sell_price: unit.sell_price || 0 })
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih Unit --</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.brand} {u.model} - {u.specs} (Beli: {formatRupiah(u.buy_price)})
                  </option>
                ))}
              </select>
            </div>

            {selectedUnit && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <span className="ml-2 font-medium">{selectedUnit.brand} {selectedUnit.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kondisi:</span>
                    <span className="ml-2 font-medium capitalize">{selectedUnit.condition}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Harga Beli:</span>
                    <span className="ml-2 font-medium">{formatRupiah(selectedUnit.buy_price)}</span>
                  </div>
                  {selectedUnit.imei_serial && (
                    <div>
                      <span className="text-gray-500">SN:</span>
                      <span className="ml-2 font-medium">{selectedUnit.imei_serial}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Data Pembeli</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Pembeli *</label>
                  <input
                    type="text"
                    required
                    value={form.buyer_name}
                    onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">No. HP</label>
                  <input
                    type="text"
                    value={form.buyer_phone}
                    onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga Jual (Rp) *</label>
                <input
                  type="number"
                  required
                  value={form.sell_price || ''}
                  onChange={(e) => setForm({ ...form, sell_price: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Metode Bayar</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value as 'tunai' | 'transfer' | 'tempo' })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="tempo">Tempo</option>
                </select>
              </div>
            </div>

            {selectedUnit && (
              <div className="rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-800">
                  Margin: <span className="font-bold text-lg">{formatRupiah(form.sell_price - selectedUnit.buy_price)}</span>
                </p>
              </div>
            )}

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
                disabled={loading || !selectedUnit}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
