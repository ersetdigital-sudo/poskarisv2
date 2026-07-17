'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, X } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:500, color:'var(--heading)', marginBottom:6,
}

export default function BeliUnitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    brand:'', model:'', specs:'', condition:'bekas' as 'baru' | 'bekas' | 'refurbished',
    imei_serial:'', buy_price:0, sell_price:0,
    source_type:'supplier' as 'supplier' | 'customer', source_name:'', source_phone:'', notes:'',
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name','Unit Laptop').single()
      if (!cat) throw new Error('Kategori tidak ditemukan')
      const { data: product, error: productError } = await supabase.from('products').insert({
        category_id: cat.id, name:`${form.brand} ${form.model}`, brand: form.brand, model: form.model,
        specs: form.specs || null, condition: form.condition, imei_serial: form.imei_serial || null,
        buy_price: form.buy_price, sell_price: form.sell_price, quantity:1, status:'ready',
      }).select().single()
      if (productError) throw productError
      await supabase.from('purchases').insert({
        product_id: product.id, source_type: form.source_type, source_name: form.source_name || null,
        source_phone: form.source_phone || null, buy_price: form.buy_price, notes: form.notes || null, created_by: user?.id,
      })
      await supabase.from('stock_movements').insert({
        product_id: product.id, type:'masuk', quantity:1, reference_type:'pembelian_unit',
        reference_id: product.id, notes:`Pembelian unit ${form.brand} ${form.model}`, created_by: user?.id,
      })
      router.push('/unit-laptop')
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ width:36, height:36, padding:0 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-h1" style={{ fontSize:20, marginBottom:2 }}>Beli Unit Laptop</h1>
          <p style={{ fontSize:13, color:'var(--mute)' }}>Tambah unit laptop baru ke stok</p>
        </div>
      </div>

      <div style={{ maxWidth:640 }}>
        <div className="card" style={{ padding:24 }}>
          {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={labelStyle}>Merk *</label><input type="text" required value={form.brand} onChange={e => setForm({...form, brand:e.target.value})} placeholder="ASUS, Lenovo" className="input input-sm" /></div>
              <div><label style={labelStyle}>Tipe/Model *</label><input type="text" required value={form.model} onChange={e => setForm({...form, model:e.target.value})} className="input input-sm" /></div>
            </div>
            <div><label style={labelStyle}>Spesifikasi</label><textarea value={form.specs} onChange={e => setForm({...form, specs:e.target.value})} placeholder="RAM 8GB, SSD 256GB, i5-1135G7" rows={2} className="textarea" style={{ minHeight:60 }} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={labelStyle}>Kondisi *</label><select value={form.condition} onChange={e => setForm({...form, condition:e.target.value as 'baru' | 'bekas' | 'refurbished'})} className="select select-sm"><option value="bekas">Bekas</option><option value="baru">Baru</option><option value="refurbished">Refurbished</option></select></div>
              <div><label style={labelStyle}>IMEI/SN</label><input type="text" value={form.imei_serial} onChange={e => setForm({...form, imei_serial:e.target.value})} className="input input-sm" /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={labelStyle}>Harga Beli (Rp) *</label><input type="number" required value={form.buy_price || ''} onChange={e => setForm({...form, buy_price:Number(e.target.value)})} className="input input-sm" /></div>
              <div><label style={labelStyle}>Harga Jual (Rp)</label><input type="number" value={form.sell_price || ''} onChange={e => setForm({...form, sell_price:Number(e.target.value)})} className="input input-sm" /></div>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--surface-muted)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--mute)' }}>Potensi Margin</span>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--success)' }}>{formatRupiah(form.sell_price - form.buy_price)}</span>
            </div>
            <div style={{ borderTop:'1px solid var(--divider)', paddingTop:16 }}>
              <h3 className="text-h3" style={{ marginBottom:10 }}>Sumber Pembelian</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><label style={labelStyle}>Tipe</label><select value={form.source_type} onChange={e => setForm({...form, source_type:e.target.value as 'supplier' | 'customer'})} className="select select-sm"><option value="supplier">Supplier</option><option value="customer">Customer</option></select></div>
                <div><label style={labelStyle}>Nama</label><input type="text" value={form.source_name} onChange={e => setForm({...form, source_name:e.target.value})} className="input input-sm" /></div>
                <div><label style={labelStyle}>No. HP</label><input type="text" value={form.source_phone} onChange={e => setForm({...form, source_phone:e.target.value})} className="input input-sm" /></div>
              </div>
            </div>
            <div><label style={labelStyle}>Catatan</label><textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} className="textarea" style={{ minHeight:60 }} /></div>
            <div style={{ display:'flex', gap:8, paddingTop:8 }}>
              <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex:1 }}>Batal</button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex:1 }}>{loading ? 'Menyimpan...' : 'Simpan Pembelian'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
