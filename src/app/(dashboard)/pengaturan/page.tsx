'use client'

import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import PageHeader from '@/components/dashboard/PageHeader'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'

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

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <div className="space-y-3">
      <PageHeader title="Pengaturan" subtitle="Kelola user dan pengaturan sistem">
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} strokeWidth={2} />
          Tambah User
        </Button>
      </PageHeader>

      {/* User table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">User</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">No. HP</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="p-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-border transition-colors hover:bg-secondary/30">
                    <td className="p-3">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      {p.id === user?.id && <p className="text-[10px] text-primary">(Anda)</p>}
                    </td>
                    <td className="p-3">
                      <Badge variant={p.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {p.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{p.phone || '-'}</td>
                    <td className="p-3">
                      <Badge variant={p.is_active ? 'success' : 'destructive'} className="text-[10px]">
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {p.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(p.id, p.is_active)}
                            className="h-7 w-7 p-0"
                            title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {p.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </Button>
                        )}
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
        <Modal title="Tambah User Baru" onClose={() => { setShowForm(false); setError('') }} maxWidth="sm">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className={labelClass}>Nama *</label>
              <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <Input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>No. HP</label>
              <Input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'karyawan' })} className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option value="karyawan">Karyawan</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
              <Button type="button" onClick={() => { setShowForm(false); setError('') }} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
              <Button type="submit" className="h-11 w-full sm:flex-1">Buat User</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
