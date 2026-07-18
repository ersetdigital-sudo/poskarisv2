'use client'

import { useEffect, useState } from 'react'
import { supabase, Service } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, Eye, FileText, Send } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RupiahInput } from '@/components/ui/rupiah-input'
import PageHeader from '@/components/dashboard/PageHeader'

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
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = services.filter(s => {
    const matchSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                        s.nota_number.toLowerCase().includes(search.toLowerCase()) || 
                        s.device_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusVariant = (status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    const map: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      proses: 'warning',
      selesai: 'success',
      dibatalkan: 'destructive',
    }
    return map[status] || 'secondary'
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Servis"
        subtitle="Kelola data servis pelanggan"
      >
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} strokeWidth={2} />
          Servis Baru
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[240px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <Input 
                type="text" 
                placeholder="Cari nama, nota, atau perangkat..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm w-[160px]"
            >
              <option value="all">Semua Status</option>
              <option value="proses">Proses</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Nota</th>
                  <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Customer</th>
                  <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Perangkat</th>
                  <th className="text-right p-3 text-xs font-medium text-ash uppercase tracking-wide">Total</th>
                  <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Tanggal</th>
                  <th className="text-center p-3 text-xs font-medium text-ash uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-xs text-stone">
                      Belum ada data servis
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-hairline hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <p className="text-xs font-mono font-semibold text-ink">{s.nota_number}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-semibold text-ink">{s.customer_name}</p>
                      <p className="text-[10px] text-stone mt-0.5">{s.customer_phone}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-semibold text-ink">{s.device_type}</p>
                      {s.device_brand && (
                        <p className="text-[10px] text-stone mt-0.5">{s.device_brand} {s.device_model}</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <p className="text-xs font-bold text-ink font-mono">{formatRupiah(s.total_fee)}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={statusVariant(s.status)} className="text-[10px] px-2 py-0.5">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <p className="text-[10px] text-stone">{new Date(s.date_in).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center">
                        <Link href={`/servis/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye size={13} />
                          </Button>
                        </Link>
                        {s.status === 'selesai' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <FileText size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Send size={13} />
                            </Button>
                          </>
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
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Servis Baru" onClose={onClose} maxWidth="2xl">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Nama Customer <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
              className="h-10 w-full"
              placeholder="Masukkan nama customer"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              No. WhatsApp <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.customer_phone}
              onChange={e => setForm({ ...form, customer_phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="h-10 w-full"
            />
          </div>
        </div>

        {/* Device Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Jenis Perangkat <span className="text-destructive">*</span>
            </label>
            <select
              value={form.device_type}
              onChange={e => setForm({ ...form, device_type: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option>Laptop</option>
              <option>PC</option>
              <option>Printer</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Merk
            </label>
            <Input
              type="text"
              value={form.device_brand}
              onChange={e => setForm({ ...form, device_brand: e.target.value })}
              className="h-10 w-full"
              placeholder="Contoh: Asus"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Model/Tipe
            </label>
            <Input
              type="text"
              value={form.device_model}
              onChange={e => setForm({ ...form, device_model: e.target.value })}
              className="h-10 w-full"
              placeholder="Contoh: ROG"
            />
          </div>
        </div>

        {/* Complaint */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Keluhan/Kerusakan
          </label>
          <textarea
            value={form.complaint}
            onChange={e => setForm({ ...form, complaint: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Deskripsikan keluhan atau kerusakan perangkat..."
          />
        </div>

        {/* Fees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Biaya Jasa (Rp)
            </label>
            <RupiahInput
              value={form.service_fee}
              onChange={v => setForm({ ...form, service_fee: v })}
              className="h-10 w-full font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Biaya Sparepart (Rp)
            </label>
            <RupiahInput
              value={form.parts_fee}
              onChange={v => setForm({ ...form, parts_fee: v })}
              className="h-10 w-full font-mono"
            />
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Biaya</span>
            <span className="font-mono text-xl font-bold text-foreground">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Catatan Tambahan
          </label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Catatan internal (opsional)..."
          />
        </div>

        {/* Actions — stack full-width di mobile, side-by-side di desktop */}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
          <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Menyimpan...
              </span>
            ) : 'Simpan Servis'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
