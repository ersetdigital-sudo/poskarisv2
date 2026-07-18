'use client'

import { useEffect, useState } from 'react'
import { supabase, OperationalCost } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Trash2, Edit } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RupiahInput } from '@/components/ui/rupiah-input'
import PageHeader from '@/components/dashboard/PageHeader'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

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

  useEffect(() => { fetchCosts() }, [filterMonth])

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
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function deleteCost(id: string) {
    if (!confirm('Hapus biaya ini?')) return
    await supabase.from('operational_costs').delete().eq('id', id)
    fetchCosts()
  }

  const totalBiaya = costs.reduce((sum, c) => sum + c.amount, 0)
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <div className="space-y-3">
      <PageHeader title="Biaya Operasional" subtitle="Kelola biaya operasional bulanan">
        <Button onClick={() => { setEditingCost(null); setShowForm(true) }} className="gap-2">
          <Plus size={16} strokeWidth={2} />
          Tambah Biaya
        </Button>
      </PageHeader>

      {/* Filter bulan */}
      <Card className="shadow-card">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterMonth.month}
              onChange={e => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })}
              className="h-9 w-[160px] rounded-lg border border-input bg-surface px-3 text-sm"
            >
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={filterMonth.year}
              onChange={e => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })}
              className="h-9 w-[120px] rounded-lg border border-input bg-surface px-3 text-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Total card */}
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-sm text-muted-foreground">Total Biaya Operasional</span>
          <span className="text-xl font-bold text-destructive">{formatRupiah(totalBiaya)}</span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama Biaya</th>
                  <th className="p-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Jumlah</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Catatan</th>
                  <th className="p-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {costs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-xs text-muted-foreground">Belum ada biaya operasional bulan ini</td></tr>
                ) : costs.map(c => (
                  <tr key={c.id} className="border-b border-border transition-colors hover:bg-secondary/30">
                    <td className="p-3 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="p-3 text-right text-sm font-semibold text-destructive">{formatRupiah(c.amount)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.notes || '-'}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingCost(c); setShowForm(true) }} className="h-7 w-7 p-0">
                          <Edit size={13} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCost(c.id)} className="h-7 w-7 p-0">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
  cost: OperationalCost | null; month: number; year: number; userId?: string; onClose: () => void; onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: cost?.name || '', amount: cost?.amount || 0, notes: cost?.notes || '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (cost) {
        const { error } = await supabase.from('operational_costs').update({ name: form.name, amount: form.amount, notes: form.notes || null }).eq('id', cost.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('operational_costs').insert({ name: form.name, amount: form.amount, period_month: month, period_year: year, notes: form.notes || null, created_by: userId })
        if (error) throw error
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={cost ? 'Edit Biaya' : 'Tambah Biaya'} onClose={onClose} maxWidth="sm">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nama Biaya *</label>
          <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sewa Tempat, Listrik" className="h-10 w-full" />
        </div>
        <div>
          <label className={labelClass}>Jumlah (Rp) *</label>
          <RupiahInput value={form.amount} onChange={v => setForm({ ...form, amount: v })} className="h-10 w-full font-mono" />
        </div>
        <div>
          <label className={labelClass}>Catatan</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
          <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
          <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan'}</Button>
        </div>
      </form>
    </Modal>
  )
}
