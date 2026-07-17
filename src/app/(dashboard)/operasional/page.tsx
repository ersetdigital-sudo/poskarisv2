'use client'

import { useEffect, useState } from 'react'
import { supabase, OperationalCost } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Trash2, Edit } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--charcoal)', marginBottom: 4, letterSpacing: '0.02em',
}

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
      const { data, error } = await supabase.from('operational_costs').select('*')
        .eq('period_month', filterMonth.month).eq('period_year', filterMonth.year)
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
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom:24, display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Biaya Operasional</h1>
          <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)' }}>Kelola biaya operasional bulanan</p>
        </div>
        <button onClick={() => { setEditingCost(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Tambah Biaya
        </button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <select value={filterMonth.month} onChange={(e) => setFilterMonth({ ...filterMonth, month: Number(e.target.value) })} className="select select-sm" style={{ width:160 }}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterMonth.year} onChange={(e) => setFilterMonth({ ...filterMonth, year: Number(e.target.value) })} className="select select-sm" style={{ width:120 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Total Card */}
      <div className="card" style={{ padding:20, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:14, fontWeight:400, color:'var(--mute)' }}>Total Biaya Operasional</span>
          <span style={{ fontSize:24, fontWeight:300, color:'var(--danger-text)', letterSpacing:'-0.48px' }}>{formatRupiah(totalBiaya)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Nama Biaya</th><th>Jumlah</th><th>Catatan</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {costs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:32, color:'var(--mute)' }}>Belum ada biaya operasional bulan ini</td></tr>
              ) : (
                costs.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight:400, color:'var(--ink)' }}>{c.name}</td>
                    <td style={{ fontWeight:500, color:'var(--danger-text)' }}>{formatRupiah(c.amount)}</td>
                    <td style={{ color:'var(--mute)' }}>{c.notes || '-'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => { setEditingCost(c); setShowForm(true) }} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:4, background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteCost(c.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:4, background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)' }}>
                          <Trash2 size={16} />
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

      {showForm && (
        <OperasionalForm cost={editingCost} month={filterMonth.month} year={filterMonth.year} userId={user?.id}
          onClose={() => { setShowForm(false); setEditingCost(null) }} onSaved={fetchCosts} />
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
        const { error } = await supabase.from('operational_costs').insert({
          name: form.name, amount: form.amount, period_month: month, period_year: year, notes: form.notes || null, created_by: userId,
        })
        if (error) throw error
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:440, padding:24 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:20, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.4px', marginBottom:20 }}>
          {cost ? 'Edit Biaya' : 'Tambah Biaya'}
        </h2>
        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>Nama Biaya *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sewa Tempat, Listrik, dll" className="input input-sm" />
          </div>
          <div>
            <label style={labelStyle}>Jumlah (Rp) *</label>
            <input type="number" required value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input input-sm" />
          </div>
          <div>
            <label style={labelStyle}>Catatan</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input input-sm" style={{ height:'auto', resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:12, paddingTop:8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex:1 }}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
