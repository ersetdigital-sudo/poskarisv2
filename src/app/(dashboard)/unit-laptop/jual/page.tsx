'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, Product, PaymentMethod, SaleItem } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CustomerAutocomplete } from '@/components/ui/customer-autocomplete'
import { findOrCreateCustomer } from '@/lib/customers'
import { ArrowLeft, Download, Plus, Trash2, Laptop, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'
import { NotaMultiPDF } from '@/components/pdf/nota-multi'
import { downloadPDF } from '@/components/pdf/utils'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

type ItemType = 'unit' | 'sparepart'

interface CartItem {
  id: string // unique key for React
  type: ItemType
  product: Product | null
  quantity: number
  sell_price: number // per unit
  buy_price: number // per unit
}

let nextCartId = 1
function newCartId() { return `item-${nextCartId++}` }

export default function JualBarangPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [savedSale, setSavedSale] = useState<{ id: string; invoice_number: string; items: CartItem[] } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(searchParams.get('customer_id') || null)

  // Product lists
  const [units, setUnits] = useState<Product[]>([])
  const [spareparts, setSpareparts] = useState<Product[]>([])

  // Cart items
  const [items, setItems] = useState<CartItem[]>([
    { id: newCartId(), type: 'unit', product: null, quantity: 1, sell_price: 0, buy_price: 0 }
  ])

  // Prefill from URL params
  const prefillNama = searchParams.get('nama') || ''
  const prefillPhone = searchParams.get('phone') || ''

  const bonusOptions = ['Mouse', 'Keyboard', 'Tas', 'Mousepad']
  const [form, setForm] = useState({
    buyer_name: prefillNama, buyer_phone: prefillPhone,
    dp_amount: 0, bonus: [] as string[], bonus_lainnya: '',
    payment_method: '', garansi: 'Tanpa Garansi', notes: '',
    sell_price_override: 0, // 0 means auto-calculate
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
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').maybeSingle()
      if (!cat) return
      const { data, error } = await supabase.from('products').select('*').eq('category_id', cat.id).gt('quantity', 0).order('created_at', { ascending: false })
      if (error) throw error
      setUnits(data || [])
    } catch (e) { console.error(e) }
  }

  async function fetchSpareparts() {
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Sparepart').maybeSingle()
      if (!cat) return
      const { data, error } = await supabase.from('products').select('*').eq('category_id', cat.id).gt('quantity', 0).order('name')
      if (error) throw error
      setSpareparts(data || [])
    } catch (e) { console.error(e) }
  }

  async function fetchPaymentMethods() {
    try {
      const { data, error } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      if (error) throw error
      setPaymentMethods(data || [])
      if (data && data.length > 0) setForm(f => ({ ...f, payment_method: data[0].name }))
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

  // Calculate totals from items
  const totalSellPrice = items.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0)
  const totalBuyPrice = items.reduce((sum, item) => sum + (item.buy_price * item.quantity), 0)
  const displaySellPrice = form.sell_price_override > 0 ? form.sell_price_override : totalSellPrice
  const hasMixedItems = items.length > 1
  const hasUnit = items.some(i => i.type === 'unit')
  const hasSparepart = items.some(i => i.type === 'sparepart')

  function addItem(type: ItemType) {
    setItems(prev => [...prev, { id: newCartId(), type, product: null, quantity: 1, sell_price: 0, buy_price: 0 }])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id: string, updates: Partial<CartItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function handleProductSelect(id: string, productId: string) {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (item.type === 'unit') {
      const unit = units.find(u => u.id === productId)
      if (unit) {
        updateItem(id, { product: unit, quantity: 1, sell_price: unit.sell_price, buy_price: unit.buy_price })
      }
    } else {
      const part = spareparts.find(s => s.id === productId)
      if (part) {
        updateItem(id, { product: part, quantity: 1, sell_price: part.sell_price, buy_price: part.buy_price })
      }
    }
  }

  function handleQuantityChange(id: string, qty: number) {
    const item = items.find(i => i.id === id)
    if (!item || !item.product) return
    const maxQty = item.type === 'unit' ? 1 : item.product.quantity
    const newQty = Math.min(Math.max(1, qty), maxQty)
    updateItem(id, { quantity: newQty })
  }

  // Validation
  function validate(): string | null {
    if (items.length === 0) return 'Tambahkan minimal 1 barang'
    for (const item of items) {
      if (!item.product) return 'Pilih barang untuk semua baris'
      if (item.quantity <= 0) return 'Qty harus lebih dari 0'
      if (item.type === 'sparepart' && item.quantity > item.product.quantity) {
        return `Qty ${item.product.name} melebihi stok (${item.product.quantity})`
      }
      if (item.type === 'unit' && item.product.quantity < 1) {
        return `Stok ${item.product.name} habis`
      }
    }
    if (!form.buyer_name.trim()) return 'Nama pembeli wajib diisi'
    if (!form.payment_method) return 'Pilih metode pembayaran'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      // Find or create customer
      let customerId = selectedCustomerId
      if (!customerId && form.buyer_phone) {
        const customer = await findOrCreateCustomer(form.buyer_name, form.buyer_phone)
        customerId = customer?.id || null
      }

      // Determine item_type for backward compatibility
      const itemType: ItemType = hasMixedItems ? 'unit' : items[0].type
      const firstItem = items[0]
      const itemName = hasMixedItems
        ? items.map(i => i.product?.name || '').join(', ')
        : (firstItem.product?.name || '')

      // Insert sale record (header)
      const { data: sale, error: saleError } = await supabase.from('sales').insert({
        customer_id: customerId,
        product_id: hasMixedItems ? null : firstItem.product?.id,
        item_type: itemType,
        item_name: itemName,
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone || null,
        sell_price: displaySellPrice,
        buy_price: totalBuyPrice,
        payment_method: form.payment_method,
        dp_amount: form.dp_amount,
        bonus: form.bonus.length > 0 ? form.bonus : null,
        bonus_lainnya: form.bonus_lainnya || null,
        garansi: form.garansi,
        warranty_end_date: hitungWarrantyEnd(),
        notes: form.notes || null,
        created_by: user?.id,
        is_multi_item: hasMixedItems,
      }).select('id, invoice_number').single()
      if (saleError) throw saleError

      // Insert sale_items
      const saleItems: Partial<SaleItem>[] = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product!.id,
        item_type: item.type,
        item_name: item.product!.name,
        quantity: item.quantity,
        buy_price: item.buy_price,
        sell_price: item.sell_price,
      }))
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      // Process stock for each item
      for (const item of items) {
        if (item.type === 'unit') {
          // Mark unit as sold
          await supabase.from('products').update({ status: 'sold', sell_price: item.sell_price }).eq('id', item.product!.id)
          await supabase.from('stock_movements').insert({
            product_id: item.product!.id, type: 'keluar', quantity: 1,
            reference_type: 'penjualan_unit', reference_id: sale.id,
            notes: `Penjualan unit ke ${form.buyer_name}`, created_by: user?.id,
          })
        } else {
          // Reduce sparepart stock via stock_movements (trigger will update quantity)
          await supabase.from('stock_movements').insert({
            product_id: item.product!.id, type: 'keluar', quantity: item.quantity,
            reference_type: 'penjualan_unit', reference_id: sale.id,
            notes: `Penjualan sparepart ke ${form.buyer_name}`, created_by: user?.id,
          })
        }
      }

      setSavedSale({ id: sale.id, invoice_number: sale.invoice_number, items: [...items] })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  async function handleDownloadPDF() {
    if (!savedSale) return
    setPdfLoading(true)
    try {
      const doc = NotaMultiPDF({
        sale: {
          id: savedSale.id,
          invoice_number: savedSale.invoice_number,
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone,
          sell_price: displaySellPrice,
          buy_price: totalBuyPrice,
          dp_amount: form.dp_amount,
          bonus: form.bonus,
          bonus_lainnya: form.bonus_lainnya,
          payment_method: form.payment_method,
          garansi: form.garansi,
          warranty_end_date: hitungWarrantyEnd(),
          date: new Date().toISOString(),
          notes: form.notes,
        },
        items: savedSale.items.map(item => ({
          name: item.product?.name || '',
          type: item.type,
          quantity: item.quantity,
          sell_price: item.sell_price,
          buy_price: item.buy_price,
        })),
        ...storeInfo,
      })
      await downloadPDF(doc, `Invoice-${savedSale.invoice_number}.pdf`)
    } catch (e) { console.error('Gagal generate PDF:', e) }
    finally { setPdfLoading(false) }
  }

  function resetForm() {
    setItems([{ id: newCartId(), type: 'unit', product: null, quantity: 1, sell_price: 0, buy_price: 0 }])
    setForm(f => ({ ...f, buyer_name: '', buyer_phone: '', sell_price_override: 0, dp_amount: 0, bonus: [], bonus_lainnya: '', garansi: 'Tanpa Garansi', notes: '' }))
    setSelectedCustomerId(null)
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
              <p className="text-xs text-muted-foreground mt-1">{savedSale.items.length} barang</p>
            </div>

            {/* Item summary */}
            <div className="text-left rounded-lg border border-border bg-secondary/50 p-3">
              {savedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{item.product?.name} x{item.quantity}</span>
                  <span className="font-mono font-medium">{formatRupiah(item.sell_price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border">
                <span>Total</span>
                <span className="font-mono">{formatRupiah(displaySellPrice)}</span>
              </div>
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
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cart Items */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-foreground">Barang yang Dijual</h3>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      units={units}
                      spareparts={spareparts}
                      canRemove={items.length > 1}
                      onRemove={() => removeItem(item.id)}
                      onProductSelect={(productId) => handleProductSelect(item.id, productId)}
                      onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                      onPriceChange={(price) => updateItem(item.id, { sell_price: price })}
                      formatRupiah={formatRupiah}
                    />
                  ))}
                </div>

                {/* Add Item Button */}
                <div className="flex gap-2 mt-3">
                  <Button type="button" variant="outline" onClick={() => addItem('unit')} className="flex-1 sm:flex-none gap-1.5 h-9 text-xs">
                    <Laptop size={14} /> Tambah Unit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => addItem('sparepart')} className="flex-1 sm:flex-none gap-1.5 h-9 text-xs">
                    <Package size={14} /> Tambah Sparepart
                  </Button>
                </div>
              </div>

              {/* Data Pembeli */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Data Pembeli</h3>
                <CustomerAutocomplete
                  nama={form.buyer_name}
                  noWa={form.buyer_phone}
                  onNamaChange={val => setForm({ ...form, buyer_name: val })}
                  onNoWaChange={val => setForm({ ...form, buyer_phone: val })}
                  onCustomerSelect={customer => {
                    setSelectedCustomerId(customer.id)
                    setForm({ ...form, buyer_name: customer.nama, buyer_phone: customer.no_wa })
                  }}
                />
              </div>

              {/* Harga Total, DP & Metode Bayar */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Pembayaran</h3>

                {/* Subtotal breakdown */}
                {items.length > 1 && (
                  <div className="mb-3 rounded-lg border border-border bg-secondary/50 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Rincian</p>
                    {items.filter(i => i.product).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-0.5">
                        <span className="text-muted-foreground">{item.product?.name} x{item.quantity}</span>
                        <span className="font-mono">{formatRupiah(item.sell_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Harga Jual Total (Rp) *</label>
                    <RupiahInput
                      value={displaySellPrice}
                      onChange={v => setForm({ ...form, sell_price_override: v })}
                      className="h-10 w-full font-mono"
                    />
                    {form.sell_price_override > 0 && form.sell_price_override !== totalSellPrice && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Subtotal: {formatRupiah(totalSellPrice)} • Selisih: <span className={form.sell_price_override < totalSellPrice ? 'text-destructive' : 'text-badge-success'}>{formatRupiah(form.sell_price_override - totalSellPrice)}</span>
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
              </div>

              {/* Garansi (jika ada unit) */}
              {hasUnit && (
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

              {/* Bonus (jika ada unit) */}
              {hasUnit && (
                <div>
                  <label className={labelClass}>Bonus</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {bonusOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.bonus.includes(opt)}
                          onChange={e => {
                            if (e.target.checked) setForm(f => ({ ...f, bonus: [...f.bonus, opt] }))
                            else setForm(f => ({ ...f, bonus: f.bonus.filter(b => b !== opt) }))
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Input type="text" value={form.bonus_lainnya} onChange={e => setForm({ ...form, bonus_lainnya: e.target.value })} className="h-10 w-full" placeholder="Bonus lainnya (opsional)" />
                  </div>
                </div>
              )}

              {/* Summary DP & Sisa */}
              {form.dp_amount > 0 && (
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga Jual</span>
                    <span className="font-mono font-medium text-foreground">{formatRupiah(displaySellPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">DP / Uang Muka</span>
                    <span className="font-mono font-medium text-badge-success">- {formatRupiah(form.dp_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Sisa Pembayaran</span>
                    <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(displaySellPrice - form.dp_amount)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Catatan</label>
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

/* ── Cart Item Row Component ─────────────────── */
function CartItemRow({ item, index, units, spareparts, canRemove, onRemove, onProductSelect, onQuantityChange, onPriceChange, formatRupiah }: {
  item: CartItem
  index: number
  units: Product[]
  spareparts: Product[]
  canRemove: boolean
  onRemove: () => void
  onProductSelect: (productId: string) => void
  onQuantityChange: (qty: number) => void
  onPriceChange: (price: number) => void
  formatRupiah: (n: number) => string
}) {
  const products = item.type === 'unit' ? units : spareparts
  const subtotal = item.sell_price * item.quantity

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={item.type === 'unit' ? 'default' : 'secondary'} className="text-[10px] capitalize">
            {item.type === 'unit' ? 'Unit' : 'Sparepart'}
          </Badge>
          <span className="text-xs text-muted-foreground">Barang #{index + 1}</span>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className="h-7 w-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Type Toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => { if (item.type !== 'unit') { onProductSelect(''); item.type = 'unit' } }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${item.type === 'unit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Laptop size={12} /> Unit
          </button>
          <button
            type="button"
            onClick={() => { if (item.type !== 'sparepart') { onProductSelect(''); item.type = 'sparepart' } }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${item.type === 'sparepart' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Package size={12} /> Sparepart
          </button>
        </div>

        {/* Product Select */}
        <select value={item.product?.id || ''} onChange={e => onProductSelect(e.target.value)} className={selectClass}>
          <option value="">{item.type === 'unit' ? 'Pilih unit...' : 'Pilih sparepart...'}</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {item.type === 'unit' ? `${p.brand} ${p.model} - ${p.specs}` : p.name}
              {item.type === 'sparepart' ? ` (Stok: ${p.quantity})` : ''} - {formatRupiah(p.sell_price)}
            </option>
          ))}
        </select>

        {/* Product Info */}
        {item.product && (
          <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div><span className="text-muted-foreground">Nama: </span><span className="font-medium">{item.product.name}</span></div>
              <div><span className="text-muted-foreground">Stok: </span><span className="font-medium">{item.product.quantity}</span></div>
              <div><span className="text-muted-foreground">Harga Beli: </span><span className="font-medium">{formatRupiah(item.product.buy_price)}</span></div>
              <div><span className="text-muted-foreground">Harga Jual: </span><span className="font-medium">{formatRupiah(item.product.sell_price)}</span></div>
            </div>
          </div>
        )}

        {/* Quantity & Price */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Qty *</label>
            <Input
              type="number"
              min={1}
              max={item.type === 'unit' ? 1 : item.product?.quantity || 999}
              value={item.quantity}
              onChange={e => onQuantityChange(Number(e.target.value))}
              className="h-9 w-full"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Harga Satuan (Rp)</label>
            <RupiahInput value={item.sell_price} onChange={onPriceChange} className="h-9 w-full font-mono" />
          </div>
        </div>

        {/* Subtotal */}
        {item.product && (
          <div className="flex justify-between items-center pt-1.5 border-t border-border">
            <span className="text-xs text-muted-foreground">Subtotal</span>
            <span className="text-sm font-bold font-mono">{formatRupiah(subtotal)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
