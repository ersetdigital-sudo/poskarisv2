'use client'

import { useEffect, useState } from 'react'
import { supabase, Service } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, Eye, FileText, Send, X } from 'lucide-react'
import Link from 'next/link'

const labelStyle: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:500, color:'var(--heading)', marginBottom:6,
}

export default function ServisPage() {
  const { isAdmin } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending:false })
      if (error) throw error
      setServices(data || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = services.filter(s => {
    const matchSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) || s.nota_number.toLowerCase().includes(search.toLowerCase()) || s.device_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      proses: 'badge-warning', selesai: 'badge-success', dibatalkan: 'badge-danger',
    }
    return map[status] || 'badge-neutral'
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h1 className="text-h1" style={{ marginBottom:4 }}>Servis</h1>
          <p className="text-small" style={{ color:'var(--mute)' }}>Kelola data servis pelanggan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Servis Baru
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--subtle)' }} />
          <input type="text" placeholder="Cari nama, nota, atau perangkat..." value={search} onChange={e => setSearch(e.target.value)} className="input input-sm" style={{ paddingLeft:36 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select select-sm" style={{ width:160 }}>
          <option value="all">Semua Status</option>
          <option value="proses">Proses</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr>
              <th>Nota</th><th>Customer</th><th>Perangkat</th><th>Total</th><th>Status</th><th>Tanggal</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--mute)' }}>Belum ada data servis</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:500, color:'var(--ink)' }}>{s.nota_number}</td>
                  <td>
                    <p style={{ color:'var(--ink)' }}>{s.customer_name}</p>
                    <p style={{ fontSize:12, color:'var(--mute)' }}>{s.customer_phone}</p>
                  </td>
                  <td>
                    <p style={{ color:'var(--ink)' }}>{s.device_type}</p>
                    {s.device_brand && <p style={{ fontSize:12, color:'var(--mute)' }}>{s.device_brand} {s.device_model}</p>}
                  </td>
                  <td style={{ fontWeight:500, color:'var(--ink)' }}>{formatRupiah(s.total_fee)}</td>
                  <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td style={{ color:'var(--mute)' }}>{new Date(s.date_in).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <Link href={`/servis/${s.id}`} className="btn btn-ghost btn-xs" style={{ width:28, height:28, padding:0 }}>
                        <Eye size={14} />
                      </Link>
                      {s.status === 'selesai' && (
                        <>
                          <button className="btn btn-ghost btn-xs" style={{ width:28, height:28, padding:0 }}><FileText size={14} /></button>
                          <button className="btn btn-ghost btn-xs" style={{ width:28, height:28, padding:0 }}><Send size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <ServisForm onClose={() => setShowForm(false)} onSaved={fetchServices} />}
    </div>
  )
}

function ServisForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_name:'', customer_phone:'', device_type:'Laptop',
    device_brand:'', device_model:'', complaint:'',
    service_fee:0, parts_fee:0, notes:'',
  })

  const total = form.service_fee + form.parts_fee
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.from('services').insert({
        customer_name: form.customer_name, customer_phone: form.customer_phone,
        device_type: form.device_type, device_brand: form.device_brand || null,
        device_model: form.device_model || null, complaint: form.complaint || null,
        service_fee: form.service_fee, parts_fee: form.parts_fee,
        total_fee: total, status:'proses', created_by: user?.id,
      })
      if (error) throw error
      onSaved(); onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520, padding:24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 className="text-h2">Servis Baru</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width:32, height:32, padding:0 }}><X size={16} /></button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Nama Customer *</label>
              <input type="text" required value={form.customer_name} onChange={e => setForm({...form, customer_name:e.target.value})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>No. WhatsApp *</label>
              <input type="text" required value={form.customer_phone} onChange={e => setForm({...form, customer_phone:e.target.value})} placeholder="08xxxxxxxxxx" className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Jenis *</label>
              <select value={form.device_type} onChange={e => setForm({...form, device_type:e.target.value})} className="select select-sm">
                <option>Laptop</option><option>PC</option><option>Printer</option><option>Lainnya</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Merk</label>
              <input type="text" value={form.device_brand} onChange={e => setForm({...form, device_brand:e.target.value})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input type="text" value={form.device_model} onChange={e => setForm({...form, device_model:e.target.value})} className="input input-sm" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Keluhan</label>
            <textarea value={form.complaint} onChange={e => setForm({...form, complaint:e.target.value})} rows={2} className="textarea" style={{ minHeight:60 }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Biaya Jasa (Rp)</label>
              <input type="number" value={form.service_fee || ''} onChange={e => setForm({...form, service_fee:Number(e.target.value)})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Biaya Sparepart (Rp)</label>
              <input type="number" value={form.parts_fee || ''} onChange={e => setForm({...form, parts_fee:Number(e.target.value)})} className="input input-sm" />
            </div>
          </div>

          <div style={{ padding:'10px 14px', background:'var(--surface-muted)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'var(--mute)' }}>Total</span>
            <span style={{ fontSize:16, fontWeight:600, color:'var(--primary)' }}>{formatRupiah(total)}</span>
          </div>

          <div>
            <label style={labelStyle}>Catatan</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} className="textarea" style={{ minHeight:60 }} />
          </div>

          <div style={{ display:'flex', gap:8, paddingTop:8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex:1 }}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
