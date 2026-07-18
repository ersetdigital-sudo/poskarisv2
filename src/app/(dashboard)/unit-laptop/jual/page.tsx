'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'

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
  const [form, setForm] = useState({ buyer_name: '', buyer_phone: '', sell_price: 0, payment_method: 'tunai' as 'tunai' | 'transfer' | 'tempo', notes: '' })

  useEffect(() => { fetchUnits() }, [])

  async function fetchUnits() {
    try {
      // Tampilkan semua produk dengan stok > 0 dan belum terjual (kategori apapun)
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

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnit) { setError('Pilih unit terlebih dahulu'); return }
    setLoading(true)
    setError('')
    try {
      const { data: sale, error: saleError } = await supabase.from('sales').insert({
        product_id: selectedUnit.id, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone || null,
        sell_price: form.sell_price, buy_price: selectedUnit.buy_price, payment_method: form.payment_method,
        notes: form.notes || null, created_by: user?.id,
      }).select().single()
      if (saleError) throw saleError
      await supabase.from('products').update({ status: 'sold', sell_price: form.sell_price }).eq('id', selectedUnit.id)
      await supabase.from('stock_movements').insert({
        product_id: selectedUnit.id, type: 'keluar', quantity: 1, reference_type: 'penjualan_unit',
        reference_id: sale.id, notes: `Penjualan unit ${selectedUnit.brand} ${selectedUnit.model} ke ${form.buyer_name}`, created_by: user?.id,
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
                  <label className={labelClass}>Metode Bayar</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as 'tunai' | 'transfer' | 'tempo' })} className={selectClass}>
                    <option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="tempo">Tempo</option>
                  </select>
                </div>
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
