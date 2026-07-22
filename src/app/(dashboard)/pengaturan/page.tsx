'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Profile, PaymentMethod } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, UserCheck, UserX, Store, Save, Eye, EyeOff, CheckCircle, Wifi, Lock, Trash2, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { TestWhatsApp } from './test-whatsapp'
import PageHeader from '@/components/dashboard/PageHeader'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'

type Tab = 'users' | 'settings' | 'payment' | 'password'

export default function PengaturanPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div className="space-y-3">
      <PageHeader title="Pengaturan" subtitle="Kelola user dan pengaturan sistem" />

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          User
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex-1 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === 'settings' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Toko & Integrasi
        </button>
        <button
          onClick={() => setTab('payment')}
          className={`flex-1 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === 'payment' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pembayaran
        </button>
        <button
          onClick={() => setTab('password')}
          className={`flex-1 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === 'password' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ubah Password
        </button>
      </div>

      {tab === 'users' && <UsersTab userId={user?.id} />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'payment' && <PaymentMethodsTab />}
      {tab === 'password' && <PasswordTab />}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TAB: USERS
   ═══════════════════════════════════════════════ */
function UsersTab({ userId }: { userId?: string }) {
  const [profiles, setProfiles] = useState<(Profile & { email?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

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
    setCreating(true)
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat user')
      setShowForm(false)
      setForm({ email: '', password: '', name: '', phone: '', role: 'karyawan' })
      fetchProfiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat user')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} strokeWidth={2} />
          Tambah User
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-2">
        {profiles.map(p => (
          <Card key={p.id} className="shadow-card">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                  {p.id === userId && <span className="text-[10px] text-primary">(Anda)</span>}
                </div>
                <Badge variant={p.is_active ? 'success' : 'destructive'} className="text-[10px] shrink-0">
                  {p.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline">
                <div className="flex items-center gap-2">
                  <Badge variant={p.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] capitalize">{p.role}</Badge>
                  {p.phone && <span className="text-[10px] text-muted-foreground">{p.phone}</span>}
                </div>
                {p.id !== userId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleActive(p.id, p.is_active)} 
                    className="h-8 px-2 text-[11px] gap-1"
                  >
                    {p.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">User</th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
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
                        {p.id === userId && <p className="text-[10px] text-primary">(Anda)</p>}
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-muted-foreground">{p.email || '-'}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={p.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] capitalize">{p.role}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{p.phone || '-'}</td>
                      <td className="p-3">
                        <Badge variant={p.is_active ? 'success' : 'destructive'} className="text-[10px]">{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center">
                          {p.id !== userId && (
                            <Button variant="ghost" size="sm" onClick={() => toggleActive(p.id, p.is_active)} className="h-7 w-7 p-0" title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
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
      </div>

      {showForm && (
        <Modal title="Tambah User Baru" onClose={() => { setShowForm(false); setError('') }} maxWidth="sm">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div><label className={labelClass}>Nama *</label><Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10 w-full" /></div>
            <div><label className={labelClass}>Email *</label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 w-full" /></div>
            <div><label className={labelClass}>Password *</label><Input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-10 w-full" /></div>
            <div><label className={labelClass}>No. HP</label><Input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-10 w-full" /></div>
            <div>
              <label className={labelClass}>Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'karyawan' })} className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option value="karyawan">Karyawan</option><option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
              <Button type="button" onClick={() => { setShowForm(false); setError('') }} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
              <Button type="submit" disabled={creating} className="h-11 w-full sm:flex-1">{creating ? 'Membuat...' : 'Buat User'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════
   TAB: SETTINGS — Toko & Integrasi WhatsApp
   ═══════════════════════════════════════════════ */
function SettingsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    fonnte_api_key: '',
    admin_phone: '',
  })

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) throw error
      const map: Record<string, string> = {}
      data?.forEach(row => { map[row.key] = row.value })
      setSettings({
        store_name: map.store_name || '',
        store_address: map.store_address || '',
        store_phone: map.store_phone || '',
        fonnte_api_key: map.fonnte_api_key || '',
        admin_phone: map.admin_phone || '',
      })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      // Upsert semua settings
      const entries = Object.entries(settings).map(([key, value]) => ({ key, value }))
      for (const entry of entries) {
        const { error } = await supabase.from('settings').upsert(entry, { onConflict: 'key' })
        if (error) throw error
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
      alert('Gagal menyimpan pengaturan')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Toko */}
      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Store size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Informasi Toko</h3>
              <p className="text-xs text-muted-foreground">Nama dan alamat toko tampil di nota PDF</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nama Toko</label>
              <Input type="text" value={settings.store_name} onChange={e => setSettings({ ...settings, store_name: e.target.value })} placeholder="Kasir POS" className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Alamat Toko</label>
              <Input type="text" value={settings.store_address} onChange={e => setSettings({ ...settings, store_address: e.target.value })} placeholder="Jl. Contoh No. 123, Kota" className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Telepon Toko</label>
              <Input type="text" value={settings.store_phone} onChange={e => setSettings({ ...settings, store_phone: e.target.value })} placeholder="0812-3456-7890" className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-success/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-badge-success"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Integrasi WhatsApp (Fonnte)</h3>
              <p className="text-xs text-muted-foreground">Untuk kirim nota PDF langsung ke customer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Fonnte API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={settings.fonnte_api_key}
                  onChange={e => setSettings({ ...settings, fonnte_api_key: e.target.value })}
                  placeholder="Masukkan API Key dari fonnte.com"
                  className="h-10 w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Dapatkan di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">fonnte.com</a> &rarr; menu Token/API
              </p>
            </div>
            <div>
              <label className={labelClass}>Nomor HP Admin</label>
              <Input type="text" value={settings.admin_phone} onChange={e => setSettings({ ...settings, admin_phone: e.target.value })} placeholder="08123456789" className="h-10 w-full" />
              <p className="mt-1.5 text-[10px] text-muted-foreground">Nomor ini untuk notifikasi ke admin (opsional)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test WhatsApp Connection */}
      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-info/10">
              <Wifi size={20} className="text-badge-info" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Test Koneksi WhatsApp</h3>
              <p className="text-xs text-muted-foreground">Kirim pesan test untuk cek Fonnte sudah konek atau belum</p>
            </div>
          </div>
          <TestWhatsApp />
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving} className="h-11 gap-2 px-8">
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : saved ? (
            <CheckCircle size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </Button>
        {saved && <span className="text-xs text-badge-success">Pengaturan berhasil disimpan</span>}
      </div>
    </form>
  )
}

/* ═══════════════════════════════════════════════
   TAB: UBAH PASSWORD
   ═══════════════════════════════════════════════ */
function PasswordTab() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok')
      return
    }

    if (form.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.newPassword
      })
      if (error) throw error
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Lock size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Ubah Password</h3>
            <p className="text-xs text-muted-foreground">Perbarui password akun Anda</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-badge-success/30 bg-badge-success/10 p-3">
            <p className="text-xs text-badge-success font-medium">Password berhasil diubah!</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelClass}>Password Saat Ini</label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                required
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Masukkan password saat ini"
                className="h-10 w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Password Baru</label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="h-10 w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Konfirmasi Password Baru</label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Ulangi password baru"
              className="h-10 w-full"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="h-11 gap-2 px-8">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Lock size={16} />
              )}
              {loading ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════
   TAB: PAYMENT METHODS
   ═══════════════════════════════════════════════ */
function PaymentMethodsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMethods() }, [])

  async function fetchMethods() {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setMethods(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        const { error } = await supabase
          .from('payment_methods')
          .update({ name: form.name, description: form.description || null })
          .eq('id', editItem.id)
        if (error) throw error
      } else {
        const maxOrder = methods.reduce((max, m) => Math.max(max, m.sort_order), 0)
        const { error } = await supabase
          .from('payment_methods')
          .insert({ name: form.name, description: form.description || null, sort_order: maxOrder + 1 })
        if (error) throw error
      }
      setShowForm(false)
      setEditItem(null)
      setForm({ name: '', description: '' })
      fetchMethods()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  async function handleDelete(item: PaymentMethod) {
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', item.id)
      if (error) throw error
      setDeleteConfirm(null)
      fetchMethods()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  async function toggleActive(item: PaymentMethod) {
    await supabase.from('payment_methods').update({ is_active: !item.is_active }).eq('id', item.id)
    fetchMethods()
  }

  function openEdit(item: PaymentMethod) {
    setEditItem(item)
    setForm({ name: item.name, description: item.description || '' })
    setShowForm(true)
  }

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Metode Pembayaran</h3>
            <p className="text-xs text-muted-foreground">Kelola metode pembayaran yang tersedia di form penjualan</p>
          </div>
          <Button onClick={() => { setEditItem(null); setForm({ name: '', description: '' }); setShowForm(true) }} size="sm" className="gap-1.5">
            <Plus size={14} /> Tambah
          </Button>
        </div>

        <div className="space-y-2">
          {methods.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <GripVertical size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
              </div>
              <Badge variant={m.is_active ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                {m.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive(m)}>
                  <CheckCircle size={13} className={m.is_active ? 'text-badge-success' : 'text-muted-foreground'} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(m)}>
                  <Store size={13} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(m)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
          {methods.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Belum ada metode pembayaran</p>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <Modal title={editItem ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'} onClose={() => { setShowForm(false); setEditItem(null) }} maxWidth="sm">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={labelClass}>Nama *</label>
                <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Cash, Transfer BCA" className="h-10 w-full" />
              </div>
              <div>
                <label className={labelClass}>Deskripsi</label>
                <Input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Keterangan (opsional)" className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1 h-10" onClick={() => { setShowForm(false); setEditItem(null) }}>Batal</Button>
                <Button type="submit" disabled={saving} className="flex-1 h-10">{saving ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <Modal title="Hapus Metode Pembayaran" onClose={() => setDeleteConfirm(null)} maxWidth="sm">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yakin ingin menghapus <span className="font-semibold text-foreground">{deleteConfirm.name}</span>?
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 h-10" onClick={() => setDeleteConfirm(null)}>Batal</Button>
                <Button variant="destructive" className="flex-1 h-10" onClick={() => handleDelete(deleteConfirm)}>Hapus</Button>
              </div>
            </div>
          </Modal>
        )}
      </CardContent>
    </Card>
  )
}
