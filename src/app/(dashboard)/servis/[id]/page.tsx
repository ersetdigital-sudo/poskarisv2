'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Service } from '@/lib/supabase'
import { ArrowLeft, Send, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotaServisPDF } from '@/components/pdf/nota-servis'
import { downloadPDF, sendWhatsAppPDF } from '@/components/pdf/utils'

export default function ServisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [waResult, setWaResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => { if (params.id) fetchService(params.id as string) }, [params.id])

  async function fetchService(id: string) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
      if (error) throw error
      setService(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function markSelesai() {
    if (!service) return
    setUpdating(true)
    try {
      const { error } = await supabase.from('services').update({ status: 'selesai', date_out: new Date().toISOString() }).eq('id', service.id)
      if (error) throw error
      fetchService(service.id)
    } catch (e) { console.error(e) } finally { setUpdating(false) }
  }

  async function handleDownloadPDF() {
    if (!service) return
    setPdfLoading(true)
    try {
      const doc = NotaServisPDF({ service })
      await downloadPDF(doc, `nota-${service.nota_number}.pdf`)
    } catch (e) {
      console.error('Gagal generate PDF:', e)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleKirimWhatsApp() {
    if (!service) return
    setWaLoading(true)
    setWaResult(null)
    try {
      const doc = NotaServisPDF({ service })
      const message = `Halo ${service.customer_name}, servis ${service.nota_number} sudah selesai.\nTotal biaya: ${formatRupiah(service.total_fee)}\n\nTerima kasih.`

      const result = await sendWhatsAppPDF({
        document: doc,
        filename: `nota-${service.nota_number}.pdf`,
        phone: service.customer_phone,
        message,
      })

      if (result.success) {
        setWaResult({ ok: true, msg: 'Nota PDF berhasil dikirim ke WhatsApp!' })
      } else {
        // Fallback: buka wa.me link tanpa file
        const waUrl = `https://wa.me/${service.customer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        setWaResult({ ok: false, msg: `Gagal kirim via API (${result.error}). Membuka WhatsApp Web...` })
      }
    } catch (e) {
      console.error('WhatsApp error:', e)
      setWaResult({ ok: false, msg: 'Terjadi kesalahan' })
    } finally {
      setWaLoading(false)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  if (!service) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Data servis tidak ditemukan</p>
        <Link href="/servis" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Kembali ke daftar servis</Link>
      </div>
    )
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
    selesai: 'success',
    proses: 'warning',
    dibatalkan: 'destructive',
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Detail Servis {service.nota_number}</h1>
          <p className="text-xs text-muted-foreground">Detail transaksi servis pelanggan</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Info */}
        <div className="space-y-3 lg:col-span-2">
          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">Informasi Customer</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nama</p>
                  <p className="text-sm font-semibold text-foreground">{service.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">No. WhatsApp</p>
                  <p className="text-sm font-semibold text-foreground">{service.customer_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">Informasi Perangkat</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Jenis</p>
                  <p className="text-sm font-semibold text-foreground">{service.device_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Merk</p>
                  <p className="text-sm font-semibold text-foreground">{service.device_brand || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model</p>
                  <p className="text-sm font-semibold text-foreground">{service.device_model || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Keluhan</p>
                  <p className="text-sm font-semibold text-foreground">{service.complaint || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {service.notes && (
            <Card className="shadow-card">
              <CardContent className="p-4 sm:p-5">
                <h3 className="mb-2 text-sm font-bold text-foreground">Catatan</h3>
                <p className="text-sm text-muted-foreground">{service.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Status + Actions */}
        <div className="space-y-3">
          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">Status & Biaya</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={statusVariant[service.status] || 'secondary'} className="text-[10px] capitalize">
                    {service.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Biaya Jasa</span>
                  <span className="font-mono text-sm font-medium text-foreground">{formatRupiah(service.service_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Biaya Sparepart</span>
                  <span className="font-mono text-sm font-medium text-foreground">{formatRupiah(service.parts_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2.5">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(service.total_fee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">Tanggal</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Masuk</span>
                  <span className="text-sm font-medium text-foreground">{new Date(service.date_in).toLocaleString('id-ID')}</span>
                </div>
                {service.date_out && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Keluar</span>
                    <span className="text-sm font-medium text-foreground">{new Date(service.date_out).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2">
            {service.status === 'proses' && (
              <Button onClick={markSelesai} disabled={updating} className="h-11 w-full gap-2">
                <CheckCircle size={16} />
                {updating ? 'Memperbarui...' : 'Tandai Selesai'}
              </Button>
            )}
            {service.status === 'selesai' && (
              <>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  variant="secondary"
                  className="h-11 w-full gap-2"
                >
                  {pdfLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                  ) : (
                    <Download size={16} />
                  )}
                  {pdfLoading ? 'Generating...' : 'Cetak Nota PDF'}
                </Button>
                <Button
                  onClick={handleKirimWhatsApp}
                  disabled={waLoading}
                  className="h-11 w-full gap-2 bg-badge-success/90 hover:bg-badge-success text-white"
                >
                  {waLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send size={16} />
                  )}
                  {waLoading ? 'Mengirim...' : 'Kirim Nota ke WhatsApp'}
                </Button>
                {waResult && (
                  <div className={`rounded-lg border p-3 text-xs ${waResult.ok ? 'border-badge-success/30 bg-badge-success/10 text-badge-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                    {waResult.msg}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
