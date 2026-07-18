'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

export default function BeliUnitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    brand: '', model: '', specs: '', condition: 'bekas' as 'baru' | 'bekas' | 'refurbished',
    imei_serial: '', buy_price: 0, sell_price: 0,
    source_type: 'supplier' as 'supplier' | 'customer', source_name: '', source_phone: '', notes: '',
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').single()
      if (!cat) throw new Error('Kategori tidak ditemukan')
      const { data: product, error: productError } = await supabase.from('products').insert({
        category_id: cat.id, name: `${form.brand} ${form.model}`, brand: form.brand, model: form.model,
        specs: form.specs || null, condition: form.condition, imei_serial: form.imei_serial || null,
        buy_price: form.buy_price, sell_price: form.sell_price, quantity: 1, status: 'ready',
      }).select().single()
      if (productError) throw productError
      await supabase.from('purchases').insert({
        product_id: product.id, source_type: form.source_type, source_name: form.source_name || null,
        source_phone: form.source_phone || null, buy_price: form.buy_price, notes: form.notes || null, created_by: user?.id,
      })
      await supabase.from('stock_movements').insert({
        product_id: product.id, type: 'masuk', quantity: 1, reference_type: 'pembelian_unit',
        reference_id: product.id, notes: `Pembelian unit ${form.brand} ${form.model}`, created_by: user?.id,
      })
      router.push('/unit-laptop')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Beli Unit Laptop</h1>
          <p className="text-xs text-muted-foreground">Tambah unit laptop baru ke stok</p>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Merk *</label>
                  <Input type="text" required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="ASUS, Lenovo" className="h-10 w-full" />
                </div>
                <div>
                  <label className={labelClass}>Tipe/Model *</label>
                  <Input type="text" required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="h-10 w-full" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Spesifikasi</label>
                <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} placeholder="RAM 8GB, SSD 256GB, i5-1135G7" rows={2} className={textareaClass} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Kondisi *</label>
                  <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })} className={selectClass}>
                    <option value="bekas">Bekas</option><option value="baru">Baru</option><option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>IMEI/SN</label>
                  <Input type="text" value={form.imei_serial} onChange={e => setForm({ ...form, imei_serial: e.target.value })} className="h-10 w-full font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Harga Beli (Rp) *</label>
                  <RupiahInput value={form.buy_price} onChange={v => setForm({ ...form, buy_price: v })} className="h-10 w-full font-mono" />
                </div>
                <div>
                  <label className={labelClass}>Harga Jual (Rp)</label>
                  <RupiahInput value={form.sell_price} onChange={v => setForm({ ...form, sell_price: v })} className="h-10 w-full font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                <span className="text-sm text-muted-foreground">Potensi Margin</span>
                <span className="font-mono text-base font-bold text-badge-success">{formatRupiah(form.sell_price - form.buy_price)}</span>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Sumber Pembelian</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Tipe</label>
                    <select value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value as 'supplier' | 'customer' })} className={selectClass}>
                      <option value="supplier">Supplier</option><option value="customer">Customer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nama</label>
                    <Input type="text" value={form.source_name} onChange={e => setForm({ ...form, source_name: e.target.value })} className="h-10 w-full" />
                  </div>
                  <div>
                    <label className={labelClass}>No. HP</label>
                    <Input type="text" value={form.source_phone} onChange={e => setForm({ ...form, source_phone: e.target.value })} className="h-10 w-full" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
                <Button type="button" onClick={() => router.back()} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Pembelian'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
