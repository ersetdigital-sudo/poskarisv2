'use client'

import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, UserCheck, UserX, X } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6,
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
    } catch (e) { console.error(e) } finally { setLoading(false) }
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
      const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, name: form.name, role: form.role, phone: form.phone || null })
      if (profileError) throw profileError
      setShowForm(false)
      setForm({ email: '', password: '', name: '', phone: '', role: 'karyawan' })
      fetchProfiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat user')
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)' }}><div className="spinner" /></div>

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h1 className="text-h1" style={{ marginBottom: 4 }}>Pengaturan</h1>
          <p className="text-small" style={{ color: 'var(--color-ink-3)' }}>Kelola user dan pengaturan sistem</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> Tambah User</button>
      </div>

      <div className="table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>No. HP</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td>
                    <p style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</p>
                    {p.id === user?.id && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>(Anda)</p>}
                  </td>
                  <td><span className={`badge ${p.role === 'admin' ? 'badge-info' : 'badge-neutral'}`}>{p.role}</span></td>
                  <td style={{ color: 'var(--color-ink-2)' }}>{p.phone || '-'}</td>
                  <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    {p.id !== user?.id && (
                      <button onClick={() => toggleActive(p.id, p.is_active)} className="btn btn-ghost btn-xs" style={{ width: 28, height: 28, padding: 0 }} title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                        {p.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 420, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h2 className="text-h2">Tambah User Baru</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}><X size={16} /></button>
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div><label style={labelStyle}>Nama *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input input-sm" /></div>
              <div><label style={labelStyle}>Email *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input input-sm" /></div>
              <div><label style={labelStyle}>Password *</label><input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input input-sm" /></div>
              <div><label style={labelStyle}>No. HP</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input input-sm" /></div>
              <div><label style={labelStyle}>Role *</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'karyawan' })} className="select select-sm"><option value="karyawan">Karyawan</option><option value="admin">Admin</option></select></div>
              <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 'var(--space-2xs)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Buat User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
