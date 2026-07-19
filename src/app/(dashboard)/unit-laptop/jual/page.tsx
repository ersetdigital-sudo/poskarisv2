'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product, PaymentMethod } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'
import { NotaUnitPDF } from '@/components/pdf/nota-unit'
import { downloadPDF, sendWhatsAppPDF } from '@/components/pdf/utils'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

export default function JualUnitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [units, setUnits] = useState<Product[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Product | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [savedSale, setSavedSale] = useState<{ id: string; invoice_number: string } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })
  const [form, setForm] = useState({
    buyer_name: '', buyer_phone: '', sell_price: 0,
    payment_method: '', garansi: 'Tanpa Garansi', notes: '',
  })

  useEffect(() => {
    fetchUnits()
    fetchPaymentMethods()
    fetchStoreSettings()
  }, [])

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

  async function fetchUnits() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0)
        .neq('status', 'sold')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUnits(data || [])
    } catch (e) { console.error(e) }
  }

  async function fetchPaymentMethods() {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      setPaymentMethods(data || [])
      if (data && data.length > 0 && !form.payment_method) {
        setForm(f => ({ ...f, payment_method: data[0].name }))
      }
    } catch (e) { console.error(e) }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  // Hitung tanggal berakhir garansi
  function hitungWarrantyEnd(): string | null {
    const input = form.garansi.trim().toLowerCase()
    if (!input || input === 'tanpa garansi') return null

    const now = new Date()
    const match = input.match(/(\d+)\s*(hari|minggu|bulan|mgg|bln)/i)
    if (!match) return null

    const angka = parseInt(match[1])
    const satuan = match[2].toLowerCase()

    if (satuan === 'hari') now.setDate(now.getDate() + angka)
    else if (satuan === 'minggu' || satuan === 'mgg') now.setDate(now.getDate() + (angka * 7))
    else if (satuan === 'bulan' || satuan === 'bln') now.setMonth(now.getMonth() + angka)

    return now.toISOString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnit) { setError('Pilih unit terlebih dahulu'); return }
    setLoading(true)
    setError('')
    try {
      const { data: sale, error: saleError } = await supabase.from('sales').insert({
        product_id: selectedUnit.id, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone || null,
        sell_price: form.sell_price, buy_price: selectedUnit.buy_price, payment_method: form.payment_method,
        garansi: form.garansi, warranty_end_date: hitungWarrantyEnd(),
        notes: form.notes || null, created_by: user?.id,
      }).select('id, invoice_number').single()
      if (saleError) throw saleError

      await supabase.from('products').update({ status: 'sold', sell_price: form.sell_price }).eq('id', selectedUnit.id)
      await supabase.from('stock_movements').insert({
        product_id: selectedUnit.id, type: 'keluar', quantity: 1, reference_type: 'penjualan_unit',
        reference_id: sale.id, notes: `Penjualan unit ${selectedUnit.brand} ${selectedUnit.model} ke ${form.buyer_name}`, created_by: user?.id,
      })

      setSavedSale(sale)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  async function handleDownloadPDF() {
    if (!savedSale || !selectedUnit) return
    setPdfLoading(true)
    try {
      const doc = NotaUnitPDF({
        sale: {
          ...savedSale,
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone,
          sell_price: form.sell_price,
          buy_price: selectedUnit.buy_price,
          payment_method: form.payment_method,
          garansi: form.garansi,
          warranty_end_date: hitungWarrantyEnd(),
          date: new Date().toISOString(),
        },
        product: selectedUnit,
        ...storeInfo,
      })
      await downloadPDF(doc, `Invoice-${savedSale.invoice_number}.pdf`)
    } catch (e) {
      console.error('Gagal generate PDF:', e)
    } finally { setPdfLoading(false) }
  }

  async function handleKirimWhatsApp() {
    if (!savedSale || !selectedUnit) return
    setWaLoading(true)
    try {
      const doc = NotaUnitPDF({
        sale: {
          ...savedSale,
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone,
          sell_price: form.sell_price,
          buy_price: selectedUnit.buy_price,
          payment_method: form.payment_method,
          garansi: form.garansi,
          warranty_end_date: hitungWarrantyEnd(),
          date: new Date().toISOString(),
        },
        product: selectedUnit,
        ...storeInfo,
      })

      const message = [
        `*Halo ${form.buyer_name},*`,
        ``,
        `Terima kasih telah membeli unit laptop di toko kami.`,
        ``,
        `━━━━━━━━━━━━━━`,
        `*DETAIL PEMBELIAN*`,
        `━━━━━━━━━━━━━━`,
        `*No. Invoice:* ${savedSale.invoice_number}`,
        `*Unit:* ${selectedUnit.brand} ${selectedUnit.model}`,
        `*Spesifikasi:* ${selectedUnit.specs || '-'}`,
        `*Harga:* ${formatRupiah(form.sell_price)}`,
        `*Metode Bayar:* ${form.payment_method}`,
        ``,
        form.garansi.toLowerCase() !== 'tanpa garansi' ? `*Garansi: ${form.garansi}*` : null,
        ``,
        `Terima kasih atas kepercayaan Anda.`,
      ].filter(Boolean).join('\n\n')

      const result = await sendWhatsAppPDF({
        document: doc,
        filename: `Invoice-${savedSale.invoice_number}.pdf`,
        phone: form.buyer_phone,
        message,
      })

      if (!result.success) {
        const waUrl = `https://wa.me/${form.buyer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
      }
    } catch (e) {
      console.error('WhatsApp error:', e)
    } finally { setWaLoading(false) }
  }

  // Setelah berhasil simpan
  if (savedSale) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/unit-laptop')} variant="secondary" className="h-9 w-9 shrink-0 p-0">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Penjualan Berhasil</h1>
            <p className="text-xs text-muted-foreground">Invoice {savedSale.invoice_number} telah dibuat</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-badge-success/20">
              <svg className="h-8 w-8 text-badge-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Transaksi Tersimpan</p>
              <p className="text-sm text-muted-foreground">Invoice: {savedSale.invoice_number}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleDownloadPDF} disabled={pdfLoading} variant="outline" className="gap-2">
                {pdfLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" /> : <Download size={16} />}
                {pdfLoading ? 'Generating...' : 'Download Invoice PDF'}
              </Button>
              {form.buyer_phone && (
                <Button onClick={handleKirimWhatsApp} disabled={waLoading} className="gap-2 bg-badge-success/90 hover:bg-badge-success text-white">
                  {waLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={16} />}
                  {waLoading ? 'Mengirim...' : 'Kirim ke WhatsApp'}
                </Button>
              )}
            </div>
            <Button onClick={() => router.push('/unit-laptop')} variant="secondary" className="w-full sm:w-auto">
              Kembali ke Daftar Unit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Jual Unit Laptop</h1>
          <p className="text-xs text-muted-foreground">Catat penjualan unit laptop</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Pilih Unit *</label>
                <select
                  value={selectedUnit?.id || ''}
                  onChange={e => {
                    const unit = units.find(u => u.id === e.target.value)
                    setSelectedUnit(unit || null)
                    if (unit) setForm({ ...form, sell_price: unit.sell_price || 0 })
                  }}
                  className={selectClass}
                >
                  <option value="">Pilih unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.brand} {u.model} - {u.specs} (Beli: {formatRupiah(u.buy_price)})</option>)}
                </select>
              </div>

              {selectedUnit && (
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Unit: </span><span className="font-medium text-foreground">{selectedUnit.brand} {selectedUnit.model}</span></div>
                    <div><span className="text-muted-foreground">Kondisi: </span><span className="font-medium capitalize text-foreground">{selectedUnit.condition}</span></div>
                    <div><span className="text-muted-foreground">Harga Beli: </span><span className="font-medium text-foreground">{formatRupiah(selectedUnit.buy_price)}</span></div>
                    {selectedUnit.imei_serial && <div><span className="text-muted-foreground">SN: </span><span className="font-mono font-medium text-foreground">{selectedUnit.imei_serial}</span></div>}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Data Pembeli</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nama Pembeli *</label>
                    <Input type="text" required value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} className="h-10 w-full" />
                  </div>
                  <div>
                    <label className={labelClass}>No. HP</label>
                    <Input type="text" value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} className="h-10 w-full" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Harga Jual (Rp) *</label>
                  <RupiahInput value={form.sell_price} onChange={v => setForm({ ...form, sell_price: v })} className="h-10 w-full font-mono" />
                </div>
                <div>
                  <label className={labelClass}>Metode Bayar *</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className={selectClass}>
                    {paymentMethods.length === 0 && <option value="">Pilih metode...</option>}
                    {paymentMethods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Garansi */}
              <div>
                <label className={labelClass}>Garansi</label>
                <Input type="text" value={form.garansi} onChange={e => setForm({ ...form, garansi: e.target.value })} className="h-10 w-full" placeholder="Contoh: 7 Hari, 1 Bulan, Tanpa Garansi" />
                {form.garansi && form.garansi.toLowerCase() !== 'tanpa garansi' && hitungWarrantyEnd() && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Garansi berlaku hingga: {new Date(hitungWarrantyEnd() || '').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {selectedUnit && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <span className="text-sm text-muted-foreground">Margin</span>
                  <span className="font-mono text-lg font-bold text-primary">{formatRupiah(form.sell_price - selectedUnit.buy_price)}</span>
                </div>
              )}

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
                <Button type="button" onClick={() => router.back()} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={loading || !selectedUnit} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Penjualan'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
