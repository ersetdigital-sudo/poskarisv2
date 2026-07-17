'use client'

import { useEffect, useState } from 'react'
import { supabase, Service } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, Eye, FileText, Send } from 'lucide-react'
import Link from 'next/link'

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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = services.filter(s => {
    const matchSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.nota_number.toLowerCase().includes(search.toLowerCase()) ||
      s.device_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      proses: 'badge-warning',
      selesai: 'badge-success',
      dibatalkan: 'badge-danger',
    }
    return map[status] || 'badge-info'
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Servis</h1>
          <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)' }}>Kelola data servis pelanggan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} />
          Servis Baru
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--stone)' }} />
          <input
            type="text"
            placeholder="Cari nama customer, nota, atau perangkat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm"
            style={{ paddingLeft:36 }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="select select-sm"
          style={{ width:160 }}
        >
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
            <thead>
              <tr>
                <th>Nota</th>
                <th>Customer</th>
                <th>Perangkat</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--mute)' }}>
                    Belum ada data servis
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:500 }}>{s.nota_number}</td>
                    <td>
                      <div>
                        <p style={{ fontWeight:400, color:'var(--ink)' }}>{s.customer_name}</p>
                        <p style={{ fontSize:12, color:'var(--mute)' }}>{s.customer_phone}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontWeight:400, color:'var(--ink)' }}>{s.device_type}</p>
                        {s.device_brand && <p style={{ fontSize:12, color:'var(--mute)' }}>{s.device_brand} {s.device_model}</p>}
                      </div>
                    </td>
                    <td style={{ fontWeight:500 }}>{formatRupiah(s.total_fee)}</td>
                    <td>
                      <span className={`badge ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color:'var(--mute)' }}>
                      {new Date(s.date_in).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <Link
                          href={`/servis/${s.id}`}
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'center',
                            width:32, height:32, borderRadius:4,
                            color:'var(--mute)', transition:'background 120ms ease, color 120ms ease',
                          }}
                          title="Detail"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--background-bone)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)' }}
                        >
                          <Eye size={16} />
                        </Link>
                        {s.status === 'selesai' && (
                          <>
                            <button
                              style={{
                                display:'flex', alignItems:'center', justifyContent:'center',
                                width:32, height:32, borderRadius:4,
                                background:'transparent', border:'none', cursor:'pointer',
                                color:'var(--mute)', transition:'background 120ms ease, color 120ms ease',
                              }}
                              title="Cetak Nota"
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--background-bone)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)' }}
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              style={{
                                display:'flex', alignItems:'center', justifyContent:'center',
                                width:32, height:32, borderRadius:4,
                                background:'transparent', border:'none', cursor:'pointer',
                                color:'var(--mute)', transition:'background 120ms ease, color 120ms ease',
                              }}
                              title="Kirim WhatsApp"
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--success-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--success-text)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)' }}
                            >
                              <Send size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && <ServisForm onClose={() => setShowForm(false)} onSaved={fetchServices} />}
    </div>
  )
}

function ServisForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', device_type: 'Laptop',
    device_brand: '', device_model: '', complaint: '',
    service_fee: 0, parts_fee: 0, notes: '',
  })

  const total = form.service_fee + form.parts_fee
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

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
        total_fee: total, status: 'proses', created_by: user?.id,
      })
      if (error) throw error
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:20, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.4px', marginBottom:20 }}>
          Servis Baru
        </h2>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Nama Customer *</label>
              <input type="text" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>No. WhatsApp *</label>
              <input type="text" required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="08xxxxxxxxxx" className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Jenis Perangkat *</label>
              <select value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })} className="select select-sm">
                <option>Laptop</option><option>PC</option><option>Printer</option><option>Lainnya</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Merk</label>
              <input type="text" value={form.device_brand} onChange={(e) => setForm({ ...form, device_brand: e.target.value })} placeholder="ASUS, Lenovo" className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Tipe/Model</label>
              <input type="text" value={form.device_model} onChange={(e) => setForm({ ...form, device_model: e.target.value })} className="input input-sm" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Keluhan</label>
            <textarea value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} rows={3} className="input input-sm" style={{ height:'auto', resize:'vertical' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Biaya Jasa (Rp)</label>
              <input type="number" value={form.service_fee || ''} onChange={(e) => setForm({ ...form, service_fee: Number(e.target.value) })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Biaya Sparepart (Rp)</label>
              <input type="number" value={form.parts_fee || ''} onChange={(e) => setForm({ ...form, parts_fee: Number(e.target.value) })} className="input input-sm" />
            </div>
          </div>

          <div style={{ background:'var(--background-bone)', borderRadius:4, padding:'10px 14px' }}>
            <p style={{ fontSize:14, fontWeight:400, color:'var(--charcoal)' }}>
              Total: <span style={{ fontWeight:600, color:'var(--primary)' }}>{formatRupiah(total)}</span>
            </p>
          </div>

          <div>
            <label style={labelStyle}>Catatan</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input input-sm" style={{ height:'auto', resize:'vertical' }} />
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex:1 }}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 400,
  color: 'var(--charcoal)',
  marginBottom: 4,
  letterSpacing: '0.02em',
}
