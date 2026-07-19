'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Service, Product } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, Eye, FileText, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RupiahInput } from '@/components/ui/rupiah-input'
import PageHeader from '@/components/dashboard/PageHeader'
import { NotaServisPDF } from '@/components/pdf/nota-servis'
import { sendWhatsAppPDF } from '@/components/pdf/utils'

export default function ServisPage() {
  const { isAdmin } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sendingWA, setSendingWA] = useState<string | null>(null)
  const [waResult, setWaResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })
  const itemsPerPage = 10

  useEffect(() => { 
    fetchServices()
    fetchStoreSettings()
  }, [filterMonth])

  async function fetchStoreSettings() {
    try {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['store_name', 'store_address', 'store_phone'])
      const map: Record<string, string> = {}
      data?.forEach(row => { map[row.key] = row.value })
      setStoreInfo({
        storeName: map.store_name || 'Kasir POS',
        storeAddress: map.store_address || '',
        storePhone: map.store_phone || '',
      })
    } catch (e) { console.error(e) }
  }

  async function fetchServices() {
    try {
      const [year, month] = filterMonth.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .gte('date_in', startDate)
        .lte('date_in', endDate)
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
      setCurrentPage(1)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function handleDelete(service: Service) {
    setDeleting(true)
    try {
      // Hapus service_parts terkait dulu
      const { error: partsError } = await supabase.from('service_parts').delete().eq('service_id', service.id)
      if (partsError) console.error('Error deleting parts:', partsError)
      
      // Hapus stock_movements terkait
      const { error: movError } = await supabase.from('stock_movements').delete().eq('reference_id', service.id).eq('reference_type', 'servis')
      if (movError) console.error('Error deleting movements:', movError)
      
      // Hapus service
      const { error } = await supabase.from('services').delete().eq('id', service.id)
      if (error) throw error
      
      setDeleteConfirm(null)
      fetchServices()
    } catch (e) {
      console.error(e)
      alert('Gagal menghapus data servis: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleKirimWhatsApp(service: Service) {
    setSendingWA(service.id)
    setWaResult(null)
    try {
      const doc = NotaServisPDF({ service, ...storeInfo })

      const tglMasuk = new Date(service.date_in).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      const sisa = service.total_fee - (service.dp_amount || 0)

      // Build parts, join with \n\n for spacing
      const parts: string[] = [
        `*Halo ${service.customer_name},*`,
        `Kabar baik! Perangkat Anda telah selesai diservis dan siap diambil.`,
        [
          `━━━━━━━━━━━━━━`,
          `*DETAIL SERVIS*`,
          `━━━━━━━━━━━━━━`,
          `*No. Nota:* ${service.nota_number}`,
          `*Perangkat:* ${service.device_type} ${service.device_brand || ''} ${service.device_model || ''}`.trim(),
          service.complaint ? `*Keluhan:* ${service.complaint}` : null,
          `*Tanggal Masuk:* ${tglMasuk}`,
        ].filter(Boolean).join('\n'),
        [
          `━━━━━━━━━━━━━━`,
          `*RINCIAN BIAYA*`,
          `━━━━━━━━━━━━━━`,
          `Biaya Jasa: *${formatRupiah(service.service_fee)}*`,
          `Biaya Sparepart: *${formatRupiah(service.parts_fee)}*`,
          `────────────────`,
          `*Total Pembayaran: ${formatRupiah(service.total_fee)}*`,
          service.dp_amount > 0 ? `*DP/Uang Muka: ${formatRupiah(service.dp_amount)}*` : null,
          service.dp_amount > 0 ? `*Sisa Pembayaran: ${formatRupiah(sisa)}*` : null,
        ].filter(Boolean).join('\n'),
      ]

      // Garansi (opsional)
      if (service.garansi && service.garansi.toLowerCase() !== 'tanpa garansi') {
        parts.push(`*Garansi: ${service.garansi}*${service.warranty_end_date ? ` (s/d ${new Date(service.warranty_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}`)
      }

      parts.push(`Terima kasih telah mempercayakan servis perangkat Anda kepada kami.`)
      parts.push(`Jika ada pertanyaan, silakan balas pesan ini. Kami siap membantu.`)

      const message = parts.join('\n\n')

      const result = await sendWhatsAppPDF({
        document: doc,
        filename: `Nota-${service.nota_number}.pdf`,
        phone: service.customer_phone,
        message,
      })

      if (result.success) {
        setWaResult({ id: service.id, ok: true, msg: 'Nota berhasil dikirim ke WhatsApp!' })
      } else {
        const waUrl = `https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        setWaResult({ id: service.id, ok: false, msg: `Gagal via API. Membuka WhatsApp Web...` })
      }
    } catch (e) {
      console.error('WhatsApp error:', e)
      setWaResult({ id: service.id, ok: false, msg: 'Terjadi kesalahan' })
    } finally {
      setSendingWA(null)
    }
  }

  async function handleKirimNotif(service: Service) {
    setSendingWA(service.id)
    setWaResult(null)
    try {
      const tglMasuk = new Date(service.date_in).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      const sisa = service.total_fee - (service.dp_amount || 0)

      const statusMessages: Record<string, string> = {
        proses: 'Perangkat Anda sedang dalam proses servis.',
        selesai: 'Kabar baik! Perangkat Anda telah selesai diservis dan siap diambil.',
        menunggu: 'Perangkat Anda sedang menunggu konfirmasi.',
        dibatalkan: 'Servis perangkat Anda telah dibatalkan.',
      }

      // Build parts, join with \n\n for spacing
      const parts: string[] = [
        `*Halo ${service.customer_name},*`,
        statusMessages[service.status] || statusMessages.proses,
        [
          `━━━━━━━━━━━━━━`,
          `*DETAIL SERVIS*`,
          `━━━━━━━━━━━━━━`,
          `*No. Nota:* ${service.nota_number}`,
          `*Perangkat:* ${service.device_type} ${service.device_brand || ''} ${service.device_model || ''}`.trim(),
          service.complaint ? `*Keluhan:* ${service.complaint}` : null,
          `*Tanggal Masuk:* ${tglMasuk}`,
          `*Status:* ${service.status.toUpperCase()}`,
          service.notes ? `*Keterangan:* ${service.notes}` : null,
        ].filter(Boolean).join('\n'),
        [
          `━━━━━━━━━━━━━━`,
          `*RINCIAN BIAYA*`,
          `━━━━━━━━━━━━━━`,
          `Biaya Jasa: *${formatRupiah(service.service_fee)}*`,
          `Biaya Sparepart: *${formatRupiah(service.parts_fee)}*`,
          `────────────────`,
          `*Total Pembayaran: ${formatRupiah(service.total_fee)}*`,
          service.dp_amount > 0 ? `*DP/Uang Muka: ${formatRupiah(service.dp_amount)}*` : null,
          service.dp_amount > 0 ? `*Sisa Pembayaran: ${formatRupiah(sisa)}*` : null,
        ].filter(Boolean).join('\n'),
      ]

      // Garansi (opsional)
      if (service.garansi && service.garansi.toLowerCase() !== 'tanpa garansi') {
        parts.push(`*Garansi: ${service.garansi}*${service.warranty_end_date ? ` (s/d ${new Date(service.warranty_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}`)
      }

      parts.push(`Terima kasih telah mempercayakan servis perangkat Anda kepada kami.`)
      parts.push(`Jika ada pertanyaan, silakan balas pesan ini. Kami siap membantu.`)

      const message = parts.join('\n\n')

      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: service.customer_phone,
          message,
        }),
      })

      const result = await res.json()

      if (res.ok) {
        setWaResult({ id: service.id, ok: true, msg: 'Notifikasi berhasil dikirim!' })
      } else {
        const waUrl = `https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        setWaResult({ id: service.id, ok: false, msg: `Gagal via API. Membuka WhatsApp Web...` })
      }
    } catch (e) {
      console.error('WhatsApp error:', e)
      setWaResult({ id: service.id, ok: false, msg: 'Terjadi kesalahan' })
    } finally {
      setSendingWA(null)
    }
  }

  const filtered = services.filter(s => {
    const matchSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                        s.nota_number.toLowerCase().includes(search.toLowerCase()) || 
                        s.device_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const statusVariant = (status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    const map: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      proses: 'warning',
      menunggu: 'default',
      selesai: 'success',
      dibatalkan: 'destructive',
    }
    return map[status] || 'secondary'
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  // Generate month options for quick select
  const monthOptions = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    monthOptions.push({ value, label })
  }

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
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <Input 
                type="text" 
                placeholder="Cari nama, nota, atau perangkat..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} 
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="month"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm flex-1 sm:w-[160px]"
              />
              <select 
                value={filterStatus} 
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }} 
                className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm flex-1 sm:w-[160px]"
              >
                <option value="all">Semua Status</option>
                <option value="proses">Proses</option>
                <option value="menunggu">Menunggu Konfirmasi</option>
                <option value="selesai">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-2">
        {paginatedData.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Belum ada data servis</p>
            </CardContent>
          </Card>
        ) : paginatedData.map(s => (
          <Card key={s.id} className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              {/* Header with status */}
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-hairline">
                <p className="text-[11px] font-mono font-semibold text-ink">{s.nota_number}</p>
                <Badge variant={statusVariant(s.status)} className="text-[10px] px-2 py-0.5">
                  {s.status}
                </Badge>
              </div>
              
              {/* Main content */}
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{s.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.device_type} {s.device_brand && `· ${s.device_brand}`} {s.device_model && `· ${s.device_model}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-mono text-ink shrink-0">{formatRupiah(s.total_fee)}</p>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-stone">{new Date(s.date_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <div className="flex gap-1.5">
                    <Link href={`/servis/${s.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                        <Eye size={12} /> Detail
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={() => handleKirimNotif(s)}
                      disabled={sendingWA === s.id}
                    >
                      {sendingWA === s.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                      ) : (
                        <Send size={12} />
                      )}
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setDeleteConfirm(s)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </div>
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
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-xs text-stone">
                        Belum ada data servis
                      </td>
                    </tr>
                  ) : paginatedData.map(s => (
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleKirimNotif(s)}
                            disabled={sendingWA === s.id}
                          >
                            {sendingWA === s.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                            ) : (
                              <Send size={13} />
                            )}
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirm(s)}
                            >
                              <Trash2 size={13} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="shadow-card">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &laquo;
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &raquo;
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title="Hapus Servis" onClose={() => setDeleteConfirm(null)} maxWidth="sm">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Yakin ingin menghapus servis <span className="font-semibold text-foreground">{deleteConfirm.nota_number}</span>?
            </p>
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="flex-1 h-10"
                onClick={() => setDeleteConfirm(null)}
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-10"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Result Toast */}
      {waResult && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-elevated ${
          waResult.ok 
            ? 'border-badge-success/30 bg-badge-success/10' 
            : 'border-destructive/30 bg-destructive/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              waResult.ok ? 'bg-badge-success/20' : 'bg-destructive/20'
            }`}>
              {waResult.ok ? (
                <svg className="h-4 w-4 text-badge-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${waResult.ok ? 'text-badge-success' : 'text-destructive'}`}>
                {waResult.msg}
              </p>
            </div>
            <button 
              onClick={() => setWaResult(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && <ServisForm onClose={() => setShowForm(false)} onSaved={fetchServices} />}
    </div>
  )
}

interface SparepartItem {
  product_id: string
  name: string
  quantity: number
  price: number
  max_qty: number
}

function ServisForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [spareparts, setSpareparts] = useState<Product[]>([])
  const [items, setItems] = useState<SparepartItem[]>([])
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', device_type: 'Laptop',
    device_brand: '', device_model: '', complaint: '', kelengkapan: '',
    service_fee: 0, dp_amount: 0, notes: '', garansi: 'Tanpa Garansi',
  })

  // Hitung total biaya sparepart dari items
  const parts_fee = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = form.service_fee + parts_fee
  const sisa = total - form.dp_amount
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  // Hitung tanggal berakhir garansi dari input manual
  function hitungWarrantyEnd(): string | null {
    const input = form.garansi.trim().toLowerCase()
    if (!input || input === 'tanpa garansi') return null

    const now = new Date()
    // Pattern: angka + satuan (hari/minggu/bulan)
    const match = input.match(/(\d+)\s*(hari|minggu|bulan|hari|mgg|bln)/i)
    if (!match) return null

    const angka = parseInt(match[1])
    const satuan = match[2].toLowerCase()

    if (satuan === 'hari') {
      now.setDate(now.getDate() + angka)
    } else if (satuan === 'minggu' || satuan === 'mgg') {
      now.setDate(now.getDate() + (angka * 7))
    } else if (satuan === 'bulan' || satuan === 'bln') {
      now.setMonth(now.getMonth() + angka)
    }

    return now.toISOString()
  }

  // Fetch sparepart dari stok
  const fetchSpareparts = useCallback(async () => {
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Sparepart').maybeSingle()
      if (!cat) return
      const { data } = await supabase.from('products').select('*').eq('category_id', cat.id).gt('quantity', 0).order('name')
      setSpareparts(data || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchSpareparts() }, [fetchSpareparts])

  // Tambah sparepart ke list
  function addSparepart() {
    setItems([...items, { product_id: '', name: '', quantity: 1, price: 0, max_qty: 0 }])
  }

  // Update sparepart item
  function updateItem(index: number, field: keyof SparepartItem, value: string | number) {
    const updated = [...items]
    if (field === 'product_id') {
      const product = spareparts.find(p => p.id === value)
      if (product) {
        updated[index] = {
          ...updated[index],
          product_id: product.id,
          name: product.name,
          price: product.sell_price || product.buy_price,
          max_qty: product.quantity,
          quantity: 1,
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setItems(updated)
  }

  // Hapus sparepart dari list
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Insert servis
      const { data: service, error: serviceError } = await supabase.from('services').insert({
        customer_name: form.customer_name, customer_phone: form.customer_phone,
        device_type: form.device_type, device_brand: form.device_brand || null,
        device_model: form.device_model || null, complaint: form.complaint || null,
        kelengkapan: form.kelengkapan || null,
        service_fee: form.service_fee, parts_fee: parts_fee,
        total_fee: total, dp_amount: form.dp_amount,
        garansi: form.garansi, warranty_end_date: hitungWarrantyEnd(),
        notes: form.notes || null,
        status: 'proses', created_by: user?.id,
      }).select('id').single()
      if (serviceError) throw serviceError

      // 2. Insert service_parts + stock_movements untuk setiap sparepart
      for (const item of items) {
        if (!item.product_id || item.quantity <= 0) continue

        // Insert service_part
        await supabase.from('service_parts').insert({
          service_id: service.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })

        // Insert stock_movement (trigger otomatis kurangi stok)
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          type: 'keluar',
          quantity: item.quantity,
          reference_type: 'servis',
          reference_id: service.id,
          notes: `Sparepart dipakai untuk servis ${form.customer_name}`,
          created_by: user?.id,
        })
      }

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
            <Input type="text" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="h-10 w-full" placeholder="Masukkan nama customer" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              No. WhatsApp <span className="text-destructive">*</span>
            </label>
            <Input type="text" required value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="08xxxxxxxxxx" className="h-10 w-full" />
          </div>
        </div>

        {/* Device Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Jenis Perangkat <span className="text-destructive">*</span>
            </label>
            <select value={form.device_type} onChange={e => setForm({ ...form, device_type: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
              <option>Laptop</option><option>PC</option><option>Printer</option><option>Lainnya</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Merk</label>
            <Input type="text" value={form.device_brand} onChange={e => setForm({ ...form, device_brand: e.target.value })} className="h-10 w-full" placeholder="Contoh: Asus" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Model/Tipe</label>
            <Input type="text" value={form.device_model} onChange={e => setForm({ ...form, device_model: e.target.value })} className="h-10 w-full" placeholder="Contoh: ROG" />
          </div>
        </div>

        {/* Kelengkapan */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kelengkapan</label>
          <Input type="text" value={form.kelengkapan} onChange={e => setForm({ ...form, kelengkapan: e.target.value })} className="h-10 w-full" placeholder="Contoh: Charger, Tas, Unit saja" />
        </div>

        {/* Complaint */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Keluhan/Kerusakan</label>
          <textarea value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" placeholder="Deskripsikan keluhan atau kerusakan perangkat..." />
        </div>

        {/* Sparepart yang Dipakai */}
        <div className="rounded-lg border border-dashed border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">Sparepart yang Dipakai</h4>
              <p className="text-[10px] text-muted-foreground">Pilih sparepart dari stok, stok otomatis berkurang saat servis disimpan</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addSparepart} className="h-8 gap-1.5 text-xs">
              <Plus size={14} /> Tambah
            </Button>
          </div>

          {items.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Belum ada sparepart ditambahkan</p>
          )}

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-col gap-2">
                  {/* Baris 1: Select sparepart (full width) */}
                  <div className="flex items-start gap-2">
                    <select
                      value={item.product_id}
                      onChange={e => updateItem(i, 'product_id', e.target.value)}
                      className="h-9 min-w-0 flex-1 rounded-md border border-input bg-surface px-2 text-xs"
                    >
                      <option value="">Pilih sparepart...</option>
                      {spareparts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (stok: {p.quantity}) — {formatRupiah(p.sell_price || p.buy_price)}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeItem(i)} className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Baris 2: Qty + Harga + Total */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-muted-foreground">Qty:</label>
                      <input
                        type="number"
                        min={1}
                        max={item.max_qty || 999}
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', Math.min(Number(e.target.value), item.max_qty || 999))}
                        className="h-9 w-16 rounded-md border border-input bg-surface px-2 text-xs text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                      <label className="text-[10px] text-muted-foreground shrink-0">Harga:</label>
                      <RupiahInput
                        value={item.price}
                        onChange={v => updateItem(i, 'price', v)}
                        className="h-9 min-w-0 flex-1 text-xs"
                      />
                    </div>
                    <div className="text-xs font-mono font-medium text-foreground shrink-0">
                      = {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biaya Jasa */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Biaya Jasa (Rp)
          </label>
          <RupiahInput value={form.service_fee} onChange={v => setForm({ ...form, service_fee: v })} className="h-10 w-full font-mono" />
        </div>

        {/* DP (Uang Muka) */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            DP / Uang Muka (Rp)
          </label>
          <RupiahInput value={form.dp_amount} onChange={v => setForm({ ...form, dp_amount: v })} className="h-10 w-full font-mono" />
        </div>

        {/* Keterangan atau Tindakan */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Keterangan atau Tindakan</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" placeholder="Tulis keterangan atau tindakan yang dilakukan..." />
        </div>

        {/* Garansi */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Garansi</label>
          <Input type="text" value={form.garansi} onChange={e => setForm({ ...form, garansi: e.target.value })} className="h-10 w-full" placeholder="Contoh: 7 Hari, 2 Minggu, 1 Bulan, Tanpa Garansi" />
          {form.garansi && form.garansi.toLowerCase() !== 'tanpa garansi' && hitungWarrantyEnd() && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Garansi berlaku hingga: {new Date(hitungWarrantyEnd() || '').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Ringkasan Biaya */}
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Sparepart ({items.length} item)</span>
              <span className="font-mono">{formatRupiah(parts_fee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Jasa</span>
              <span className="font-mono">{formatRupiah(form.service_fee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-bold text-foreground">Total Biaya</span>
              <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(total)}</span>
            </div>
            {form.dp_amount > 0 && (
              <>
                <div className="flex justify-between text-badge-success">
                  <span>DP / Uang Muka</span>
                  <span className="font-mono">- {formatRupiah(form.dp_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-bold text-foreground">Sisa Pembayaran</span>
                  <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(sisa)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
          <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
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
