'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6,
}

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
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').single()
      if (!cat) return
      const { data } = await supabase.from('products').select('*').eq('category_id', cat.id).eq('status', 'ready').order('created_at', { ascending: false })
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
    <div>
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ width: 36, height: 36, padding: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--text-h2)', marginBottom: 2 }}>Jual Unit Laptop</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Catat penjualan unit laptop</p>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>
              <label style={labelStyle}>Pilih Unit *</label>
              <select value={selectedUnit?.id || ''} onChange={e => { const unit = units.find(u => u.id === e.target.value); setSelectedUnit(unit || null); if (unit) setForm({ ...form, sell_price: unit.sell_price || 0 }) }} className="select select-sm">
                <option value="">Pilih unit...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.brand} {u.model} - {u.specs} (Beli: {formatRupiah(u.buy_price)})</option>)}
              </select>
            </div>
            {selectedUnit && (
              <div style={{ padding: 'var(--space-xs) var(--space-sm)', background: 'var(--color-paper-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xs)', fontSize: 'var(--text-sm)' }}>
                  <div><span style={{ color: 'var(--color-ink-3)' }}>Unit: </span><span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{selectedUnit.brand} {selectedUnit.model}</span></div>
                  <div><span style={{ color: 'var(--color-ink-3)' }}>Kondisi: </span><span style={{ fontWeight: 500, color: 'var(--color-ink)', textTransform: 'capitalize' }}>{selectedUnit.condition}</span></div>
                  <div><span style={{ color: 'var(--color-ink-3)' }}>Harga Beli: </span><span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{formatRupiah(selectedUnit.buy_price)}</span></div>
                  {selectedUnit.imei_serial && <div><span style={{ color: 'var(--color-ink-3)' }}>SN: </span><span style={{ fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{selectedUnit.imei_serial}</span></div>}
                </div>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--space-sm)' }}>
              <h3 className="text-h3" style={{ marginBottom: 'var(--space-xs)' }}>Data Pembeli</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
                <div><label style={labelStyle}>Nama Pembeli *</label><input type="text" required value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} className="input input-sm" /></div>
                <div><label style={labelStyle}>No. HP</label><input type="text" value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} className="input input-sm" /></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
              <div><label style={labelStyle}>Harga Jual (Rp) *</label><input type="number" required value={form.sell_price || ''} onChange={e => setForm({ ...form, sell_price: Number(e.target.value) })} className="input input-sm" /></div>
              <div><label style={labelStyle}>Metode Bayar</label><select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as 'tunai' | 'transfer' | 'tempo' })} className="select select-sm"><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="tempo">Tempo</option></select></div>
            </div>
            {selectedUnit && (
              <div style={{
                padding: 'var(--space-xs) var(--space-sm)', background: 'var(--color-accent-soft)',
                borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Margin</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-accent)' }}>{formatRupiah(form.sell_price - selectedUnit.buy_price)}</span>
              </div>
            )}
            <div><label style={labelStyle}>Catatan</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="textarea" style={{ minHeight: 60 }} /></div>
            <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 'var(--space-2xs)' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button type="submit" disabled={loading || !selectedUnit} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Menyimpan...' : 'Simpan Penjualan'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
