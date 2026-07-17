'use client'

import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, UserCheck, UserX } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--charcoal)', marginBottom: 4, letterSpacing: '0.02em',
}

export default function PengaturanPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchProfiles() }, [])

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    fetchProfiles()
  }

  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', role: 'karyawan' as 'admin' | 'karyawan' })

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat user')

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id, name: form.name, role: form.role, phone: form.phone || null,
      })
      if (profileError) throw profileError

      setShowForm(false)
      setForm({ email: '', password: '', name: '', phone: '', role: 'karyawan' })
      fetchProfiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat user')
    }
  }

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
          <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Pengaturan</h1>
          <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)' }}>Kelola user dan pengaturan sistem</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Tambah User
        </button>
      </div>

      <div className="table-wrapper">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr><th>User</th><th>Role</th><th>No. HP</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <p style={{ fontWeight:400, color:'var(--ink)' }}>{p.name}</p>
                      {p.id === user?.id && <p style={{ fontSize:12, color:'var(--primary)' }}>(Anda)</p>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td style={{ color:'var(--charcoal)' }}>{p.phone || '-'}</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    {p.id !== user?.id && (
                      <button
                        onClick={() => toggleActive(p.id, p.is_active)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:4, background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)' }}
                        title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {p.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth:440, padding:24 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:20, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.4px', marginBottom:20 }}>
              Tambah User Baru
            </h2>
            {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}
            <form onSubmit={handleCreateUser} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={labelStyle}>Nama *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input input-sm" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input input-sm" />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input input-sm" />
              </div>
              <div>
                <label style={labelStyle}>No. HP</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input input-sm" />
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'karyawan' })} className="select select-sm">
                  <option value="karyawan">Karyawan</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:12, paddingTop:8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex:1 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex:1 }}>Buat User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
