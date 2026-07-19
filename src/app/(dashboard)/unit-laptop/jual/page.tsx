'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product, PaymentMethod } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Download, Send, Laptop, Package, Pencil, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'
import { NotaUnitPDF } from '@/components/pdf/nota-unit'
import { NotaSparepartPDF } from '@/components/pdf/nota-sparepart'
import { downloadPDF, sendWhatsAppPDF } from '@/components/pdf/utils'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

type TabType = 'unit' | 'sparepart'

export default function JualBarangPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabType>('unit')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [savedSale, setSavedSale] = useState<{ id: string; invoice_number: string; item_type: string } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })

  // Unit state
  const [units, setUnits] = useState<Product[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Product | null>(null)

  // Sparepart state
  const [spareparts, setSpareparts] = useState<Product[]>([])
  const [selectedSparepart, setSelectedSparepart] = useState<Product | null>(null)
  const [isPriceEditable, setIsPriceEditable] = useState(false)

  const bonusOptions = ['Mouse', 'Keyboard', 'Tas', 'Mousepad']
  const [form, setForm] = useState({
    buyer_name: '', buyer_phone: '', sell_price: 0, quantity: 1,
    dp_amount: 0, bonus: [] as string[], bonus_lainnya: '',
    payment_method: '', garansi: 'Tanpa Garansi', notes: '',
  })

  useEffect(() => {
    fetchUnits()
    fetchSpareparts()
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
      // Filter: hanya kategori "Unit Laptop", stok > 0
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').maybeSingle()
      if (!cat) return
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', cat.id)
        .gt('quantity', 0)
        .order('created_at', { ascending: false })
      if (error) throw error
      setUnits(data || [])
    } catch (e) { console.error(e) }
  }

  async function fetchSpareparts() {
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Sparepart').maybeSingle()
      if (!cat) return
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', cat.id)
        .gt('quantity', 0)
        .order('name')
      if (error) throw error
      setSpareparts(data || [])
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
      if (data && data.length > 0) {
        setForm(f => ({ ...f, payment_method: data[0].name }))
      }
    } catch (e) { console.error(e) }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

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

  function resetForm() {
    setForm({ buyer_name: '', buyer_phone: '', sell_price: 0, quantity: 1, dp_amount: 0, bonus: [], bonus_lainnya: '', payment_method: paymentMethods[0]?.name || '', garansi: 'Tanpa Garansi', notes: '' })
    setSelectedUnit(null)
    setSelectedSparepart(null)
    setIsPriceEditable(false)
  }

  function handleTabChange(newTab: TabType) {
    setTab(newTab)
    resetForm()
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (tab === 'unit' && !selectedUnit) { setError('Pilih unit terlebih dahulu'); return }
    if (tab === 'sparepart' && !selectedSparepart) { setError('Pilih sparepart terlebih dahulu'); return }
    if (tab === 'sparepart' && form.quantity <= 0) { setError('Qty harus lebih dari 0'); return }
    if (tab === 'sparepart' && selectedSparepart && form.quantity > selectedSparepart.quantity) { setError('Qty melebihi stok tersedia'); return }

    setLoading(true)
    try {
      if (tab === 'unit' && selectedUnit) {
        const { data: sale, error: saleError } = await supabase.from('sales').insert({
          product_id: selectedUnit.id, item_type: 'unit',
          item_name: `${selectedUnit.brand} ${selectedUnit.model}`,
          quantity: 1, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone || null,
          sell_price: form.sell_price, buy_price: selectedUnit.buy_price, payment_method: form.payment_method,
          dp_amount: form.dp_amount, bonus: form.bonus.length > 0 ? form.bonus : null, bonus_lainnya: form.bonus_lainnya || null,
          garansi: form.garansi, warranty_end_date: hitungWarrantyEnd(),
          notes: form.notes || null, created_by: user?.id,
        }).select('id, invoice_number, item_type').single()
        if (saleError) throw saleError

        await supabase.from('products').update({ status: 'sold', sell_price: form.sell_price }).eq('id', selectedUnit.id)
        await supabase.from('stock_movements').insert({
          product_id: selectedUnit.id, type: 'keluar', quantity: 1, reference_type: 'penjualan_unit',
          reference_id: sale.id, notes: `Penjualan unit ke ${form.buyer_name}`, created_by: user?.id,
        })
        setSavedSale(sale)
      } else if (tab === 'sparepart' && selectedSparepart) {
        const { data: sale, error: saleError } = await supabase.from('sales').insert({
          product_id: selectedSparepart.id, item_type: 'sparepart',
          item_name: selectedSparepart.name,
          quantity: form.quantity, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone || null,
          sell_price: form.sell_price, buy_price: selectedSparepart.buy_price * form.quantity,
          payment_method: form.payment_method, notes: form.notes || null, created_by: user?.id,
        }).select('id, invoice_number, item_type').single()
        if (saleError) throw saleError

        await supabase.from('stock_movements').insert({
          product_id: selectedSparepart.id, type: 'keluar', quantity: form.quantity,
          reference_type: 'penjualan_unit', reference_id: sale.id,
          notes: `Penjualan sparepart ke ${form.buyer_name}`, created_by: user?.id,
        })
        setSavedSale(sale)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  async function handleDownloadPDF() {
    if (!savedSale) return
    setPdfLoading(true)
    try {
      let doc
      if (savedSale.item_type === 'unit' && selectedUnit) {
        doc = NotaUnitPDF({
          sale: { ...savedSale, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone, sell_price: form.sell_price, buy_price: selectedUnit.buy_price, dp_amount: form.dp_amount, bonus: form.bonus, bonus_lainnya: form.bonus_lainnya, payment_method: form.payment_method, garansi: form.garansi, warranty_end_date: hitungWarrantyEnd(), date: new Date().toISOString() },
          product: selectedUnit, ...storeInfo,
        })
      } else if (savedSale.item_type === 'sparepart' && selectedSparepart) {
        doc = NotaSparepartPDF({
          sale: { ...savedSale, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone, sell_price: form.sell_price, quantity: form.quantity, payment_method: form.payment_method, date: new Date().toISOString() },
          product: selectedSparepart, ...storeInfo,
        })
      }
      if (doc) await downloadPDF(doc, `Invoice-${savedSale.invoice_number}.pdf`)
    } catch (e) { console.error('Gagal generate PDF:', e) }
    finally { setPdfLoading(false) }
  }

  // Success page
  if (savedSale) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => { setSavedSale(null); resetForm() }} variant="secondary" className="h-9 w-9 shrink-0 p-0">
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
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { setSavedSale(null); resetForm() }} variant="secondary">Jual Lagi</Button>
              <Button onClick={() => router.push('/riwayat-penjualan')} variant="outline">Lihat Riwayat</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Jual Barang</h1>
          <p className="text-xs text-muted-foreground">Catat penjualan unit laptop atau sparepart</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Tab Toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1 mb-4">
          <button onClick={() => handleTabChange('unit')} className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${tab === 'unit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Laptop size={16} /> Unit Laptop
          </button>
          <button onClick={() => handleTabChange('sparepart')} className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${tab === 'sparepart' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Package size={16} /> Sparepart
          </button>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pilih Barang */}
              {tab === 'unit' ? (
                <div>
                  <label className={labelClass}>Pilih Unit *</label>
                  <select value={selectedUnit?.id || ''} onChange={e => { const u = units.find(u => u.id === e.target.value); setSelectedUnit(u || null); if (u) { setForm(f => ({ ...f, sell_price: u.sell_price || 0 })); setIsPriceEditable(false) } }} className={selectClass}>
                    <option value="">Pilih unit...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.brand} {u.model} - {u.specs} (Jual: {formatRupiah(u.sell_price)})</option>)}
                  </select>
                  {selectedUnit && (
                    <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Unit: </span><span className="font-medium text-foreground">{selectedUnit.brand} {selectedUnit.model}</span></div>
                        <div><span className="text-muted-foreground">Kondisi: </span><span className="font-medium capitalize text-foreground">{selectedUnit.condition}</span></div>
                        <div><span className="text-muted-foreground">Harga Beli: </span><span className="font-medium text-foreground">{formatRupiah(selectedUnit.buy_price)}</span></div>
                        {selectedUnit.imei_serial && <div><span className="text-muted-foreground">SN: </span><span className="font-mono font-medium text-foreground">{selectedUnit.imei_serial}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Pilih Sparepart *</label>
                  <select value={selectedSparepart?.id || ''} onChange={e => { const s = spareparts.find(s => s.id === e.target.value); setSelectedSparepart(s || null); if (s) setForm(f => ({ ...f, sell_price: s.sell_price || 0, quantity: 1 })) }} className={selectClass}>
                    <option value="">Pilih sparepart...</option>
                    {spareparts.map(s => <option key={s.id} value={s.id}>{s.name} (Stok: {s.quantity}) - {formatRupiah(s.sell_price)}</option>)}
                  </select>
                  {selectedSparepart && (
                    <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Nama: </span><span className="font-medium text-foreground">{selectedSparepart.name}</span></div>
                        <div><span className="text-muted-foreground">Stok: </span><span className="font-medium text-foreground">{selectedSparepart.quantity}</span></div>
                        <div><span className="text-muted-foreground">Harga Beli: </span><span className="font-medium text-foreground">{formatRupiah(selectedSparepart.buy_price)}</span></div>
                        <div><span className="text-muted-foreground">Harga Jual: </span><span className="font-medium text-foreground">{formatRupiah(selectedSparepart.sell_price)}</span></div>
                      </div>
                    </div>
                  )}
                  {tab === 'sparepart' && (
                    <div className="mt-3">
                      <label className={labelClass}>Qty *</label>
                      <Input type="number" min={1} max={selectedSparepart?.quantity || 999} required value={form.quantity} onChange={e => { const qty = Math.min(Number(e.target.value), selectedSparepart?.quantity || 999); setForm(f => ({ ...f, quantity: qty, sell_price: (selectedSparepart?.sell_price || 0) * qty })) }} className="h-10 w-full" />
                    </div>
                  )}
                </div>
              )}

              {/* Data Pembeli */}
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

              {/* Harga, DP & Metode Bayar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Harga Jual (Rp) *</label>
                  <div className="relative">
                    {tab === 'unit' && !isPriceEditable ? (
                      <>
                        <input
                          type="text"
                          value={formatRupiah(form.sell_price)}
                          readOnly
                          className="h-10 w-full rounded-lg border border-input bg-muted px-3 pr-10 text-sm font-mono text-foreground cursor-default"
                        />
                        <button
                          type="button"
                          onClick={() => setIsPriceEditable(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit harga"
                        >
                          <Pencil size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="relative">
                        <RupiahInput
                          value={form.sell_price}
                          onChange={v => setForm({ ...form, sell_price: v })}
                          className="h-10 w-full font-mono pr-10"
                        />
                        {tab === 'unit' && (
                          <button
                            type="button"
                            onClick={() => setIsPriceEditable(false)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded bg-badge-success/20 text-badge-success hover:bg-badge-success/30 transition-colors"
                            title="Konfirmasi harga"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {tab === 'unit' && selectedUnit && form.sell_price !== selectedUnit.sell_price && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Harga awal: {formatRupiah(selectedUnit.sell_price)} • Selisih: <span className={form.sell_price < selectedUnit.sell_price ? 'text-destructive' : 'text-badge-success'}>{formatRupiah(form.sell_price - selectedUnit.sell_price)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>DP / Uang Muka (Rp)</label>
                  <RupiahInput value={form.dp_amount} onChange={v => setForm({ ...form, dp_amount: v })} className="h-10 w-full font-mono" />
                </div>
                <div>
                  <label className={labelClass}>Metode Bayar *</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className={selectClass}>
                    {paymentMethods.length === 0 && <option value="">Pilih metode...</option>}
                    {paymentMethods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Garansi (hanya untuk unit) */}
              {tab === 'unit' && (
                <div>
                  <label className={labelClass}>Garansi</label>
                  <Input type="text" value={form.garansi} onChange={e => setForm({ ...form, garansi: e.target.value })} className="h-10 w-full" placeholder="Contoh: 7 Hari, 1 Bulan, Tanpa Garansi" />
                  {form.garansi && form.garansi.toLowerCase() !== 'tanpa garansi' && hitungWarrantyEnd() && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Garansi berlaku hingga: {new Date(hitungWarrantyEnd() || '').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {/* Bonus (hanya untuk unit) */}
              {tab === 'unit' && (
                <div>
                  <label className={labelClass}>Bonus</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {bonusOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.bonus.includes(opt)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, bonus: [...f.bonus, opt] }))
                            } else {
                              setForm(f => ({ ...f, bonus: f.bonus.filter(b => b !== opt) }))
                            }
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Input
                      type="text"
                      value={form.bonus_lainnya}
                      onChange={e => setForm({ ...form, bonus_lainnya: e.target.value })}
                      className="h-10 w-full"
                      placeholder="Bonus lainnya (opsional), contoh: Cooling Pad"
                    />
                  </div>
                </div>
              )}

              {/* Summary DP & Sisa (hanya untuk unit) */}
              {tab === 'unit' && form.dp_amount > 0 && (
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga Jual</span>
                    <span className="font-mono font-medium text-foreground">{formatRupiah(form.sell_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">DP / Uang Muka</span>
                    <span className="font-mono font-medium text-badge-success">- {formatRupiah(form.dp_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Sisa Pembayaran</span>
                    <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(form.sell_price - form.dp_amount)}</span>
                  </div>
                </div>
              )}

              {/* Margin */}
              {tab === 'unit' && selectedUnit && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <span className="text-sm text-muted-foreground">Margin</span>
                  <span className="font-mono text-lg font-bold text-primary">{formatRupiah(form.sell_price - selectedUnit.buy_price)}</span>
                </div>
              )}

              <div>
                <label className={labelClass}>Catatan OS dan Aplikasi</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} placeholder="Contoh: Sudah Terinstal Aplikasi Office Standar" />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
                <Button type="button" onClick={() => router.back()} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Penjualan'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
