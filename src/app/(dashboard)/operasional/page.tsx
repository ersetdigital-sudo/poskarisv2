'use client'

import { useEffect, useState } from 'react'
import { supabase, OperationalCost } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Trash2, Edit } from 'lucide-react'

export default function OperasionalPage() {
  const { user } = useAuth()
  const [costs, setCosts] = useState<OperationalCost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  })

  useEffect(() => {
    fetchCosts()
  }, [filterMonth])

  async function fetchCosts() {
    try {
      const { data, error } = await supabase
        .from('operational_costs')
        .select('*')
        .eq('period_month', filterMonth.month)
        .eq('period_year', filterMonth.year)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCosts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCost(id: string) {
    if (!confirm('Hapus biaya ini?')) return
    await supabase.from('operational_costs').delete().eq('id', id)
    fetchCosts()
  }

  const totalBiaya = costs.reduce((sum, c) => sum + c.amount, 0)
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biaya Operasional</h1>
          <p className="text-sm text-gray-500">Kelola biaya operasional bulanan</p>
        </div>
        <button
          onClick={() => { setEditingCost(null); setShowForm(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Biaya
        </button>
      </div>

      {/* Filter Bulan */}
      <div className="mb-4 flex gap-3">
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

      {/* Total */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Biaya Operasional</span>
          <span className="text-2xl font-bold text-red-600">{formatRupiah(totalBiaya)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Nama Biaya</th>
                <th className="px-4 py-3 font-medium text-gray-600">Jumlah</th>
                <th className="px-4 py-3 font-medium text-gray-600">Catatan</th>
                <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Belum ada biaya operasional bulan ini
                  </td>
                </tr>
              ) : (
                costs.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 font-medium text-red-600">{formatRupiah(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{c.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingCost(c); setShowForm(true) }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCost(c.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <OperasionalForm
          cost={editingCost}
          month={filterMonth.month}
          year={filterMonth.year}
          userId={user?.id}
          onClose={() => { setShowForm(false); setEditingCost(null) }}
          onSaved={fetchCosts}
        />
      )}
    </div>
  )
}

function OperasionalForm({ cost, month, year, userId, onClose, onSaved }: {
  cost: OperationalCost | null
  month: number
  year: number
  userId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: cost?.name || '',
    amount: cost?.amount || 0,
    notes: cost?.notes || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (cost) {
        const { error } = await supabase
          .from('operational_costs')
          .update({ name: form.name, amount: form.amount, notes: form.notes || null })
          .eq('id', cost.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('operational_costs')
          .insert({
            name: form.name,
            amount: form.amount,
            period_month: month,
            period_year: year,
            notes: form.notes || null,
            created_by: userId,
          })
        if (error) throw error
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {cost ? 'Edit Biaya' : 'Tambah Biaya'}
        </h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Biaya *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Sewa Tempat, Listrik, Internet, Gaji, dll"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jumlah (Rp) *</label>
            <input
              type="number"
              required
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
