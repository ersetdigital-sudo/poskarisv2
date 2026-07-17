'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, ArrowDown, ArrowUp, AlertTriangle, Plus, Package, X } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:500, color:'var(--heading)', marginBottom:6,
}

export default function StokPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending:false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending:false }).limit(100),
      ])
      setProducts(prodRes.data || [])
      setMovements(movRes.data || [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const catName = (p as Product & { categories?: { name: string } }).categories?.name || ''
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku||'').toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || catName === filterCategory
    return matchSearch && matchCategory
  })

  const lowStock = products.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0)
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}><div className="spinner" /></div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h1 className="text-h1" style={{ marginBottom:4 }}>Stok Barang</h1>
          <p className="text-small" style={{ color:'var(--mute)' }}>Kelola stok unit laptop dan sparepart</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
          <Plus size={16} /> Tambah Stok
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom:16 }}>
          <AlertTriangle size={16} />
          <div>
            <p style={{ fontWeight:500, marginBottom:4 }}>Stok Menipis</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {lowStock.map(p => <span key={p.id} className="badge badge-warning">{p.name} ({p.quantity})</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--subtle)' }} />
          <input type="text" placeholder="Cari nama atau SKU..." value={search} onChange={e => setSearch(e.target.value)} className="input input-sm" style={{ paddingLeft:36 }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="select select-sm" style={{ width:180 }}>
          <option value="all">Semua Kategori</option>
          <option value="Unit Laptop">Unit Laptop</option>
          <option value="Sparepart">Sparepart</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr>
              <th>Barang</th><th>Kategori</th><th>Stok</th><th>Harga Beli</th><th>Harga Jual</th><th>Status</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}>
                  <Package size={28} style={{ color:'var(--subtle)', margin:'0 auto 8px', display:'block' }} />
                  <p style={{ color:'var(--mute)' }}>Belum ada data stok</p>
                </td></tr>
              ) : filtered.map(p => {
                const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
                const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
                const statusClass = p.status === 'ready' ? 'badge-success' : p.status === 'sold' ? 'badge-info' : 'badge-neutral'
                return (
                  <tr key={p.id} style={{ background: isLow ? 'var(--warning-bg)' : undefined }}>
                    <td>
                      <p style={{ fontWeight:500, color:'var(--ink)' }}>{p.name}</p>
                      <p style={{ fontSize:12, color:'var(--mute)' }}>{p.sku || '-'}</p>
                    </td>
                    <td style={{ color:'var(--body)' }}>{catName}</td>
                    <td>
                      <span style={{ fontWeight:500, color: isLow ? '#b45309' : 'var(--ink)' }}>{p.quantity}</span>
                      {isLow && <AlertTriangle size={12} style={{ marginLeft:4, color:'#b45309', display:'inline' }} />}
                    </td>
                    <td style={{ color:'var(--body)' }}>{formatRupiah(p.buy_price)}</td>
                    <td style={{ color:'var(--body)' }}>{formatRupiah(p.sell_price)}</td>
                    <td><span className={`badge ${statusClass}`}>{p.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-secondary btn-xs" onClick={() => setAdjustProduct(p)}>
                          <Plus size={12} /> Stok
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setSelectedProduct(p)}>Mutasi</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && <AddStokForm onClose={() => setShowAddForm(false)} onSaved={fetchData} userId={user?.id} />}
      {adjustProduct && <AdjustStokForm product={adjustProduct} onClose={() => setAdjustProduct(null)} onSaved={fetchData} userId={user?.id} />}

      {/* Mutasi Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth:440, padding:24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <h2 className="text-h2">Mutasi Stok</h2>
              <button onClick={() => setSelectedProduct(null)} className="btn btn-ghost btn-sm" style={{ width:32, height:32, padding:0 }}>✕</button>
            </div>
            <p style={{ fontSize:13, color:'var(--mute)', marginBottom:20 }}>{selectedProduct.name} — Stok: <strong style={{ color:'var(--ink)' }}>{selectedProduct.quantity}</strong></p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto' }}>
              {movements.filter(m => m.product_id === selectedProduct.id).map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:8, border:'1px solid var(--border)' }}>
                  {m.type === 'masuk' ? <ArrowDown size={16} color="var(--success)" /> : <ArrowUp size={16} color="var(--danger)" />}
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{m.type === 'masuk' ? '+' : '-'}{m.quantity}</p>
                    <p style={{ fontSize:12, color:'var(--mute)' }}>{m.notes || m.reference_type}</p>
                  </div>
                  <span style={{ fontSize:12, color:'var(--subtle)' }}>{new Date(m.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
              {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
                <p style={{ padding:24, textAlign:'center', color:'var(--mute)' }}>Belum ada mutasi</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Add Product Form ─────────────────────────── */
function AddStokForm({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    category_id:'', name:'', sku:'', brand:'', model:'', specs:'',
    condition:'baru' as 'baru' | 'bekas' | 'refurbished',
    buy_price:0, sell_price:0, quantity:1, min_quantity:0,
  })

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.from('products').insert({
        category_id: form.category_id || null, name: form.name, sku: form.sku || null,
        brand: form.brand || null, model: form.model || null, specs: form.specs || null,
        condition: form.condition, buy_price: form.buy_price, sell_price: form.sell_price,
        quantity: form.quantity, min_quantity: form.min_quantity, status:'ready',
      })
      if (error) throw error
      if (form.quantity > 0) {
        const { data: prod } = await supabase.from('products').select('id').eq('name', form.name).order('created_at', { ascending:false }).limit(1).single()
        if (prod) await supabase.from('stock_movements').insert({ product_id: prod.id, type:'masuk', quantity: form.quantity, reference_type:'adjustment', notes:`Stok awal ${form.name}`, created_by: userId })
      }
      onSaved(); onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560, padding:24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 className="text-h2">Tambah Stok Barang</h2>
            <p style={{ fontSize:13, color:'var(--mute)', marginTop:2 }}>Tambah barang baru ke inventaris</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width:32, height:32, padding:0 }}><X size={16} /></button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={labelStyle}>Kategori *</label>
            <select required value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})} className="select select-sm">
              <option value="">Pilih kategori...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Nama Barang *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="RAM 8GB DDR4" className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({...form, sku:e.target.value})} placeholder="SKU-001" className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Merk</label>
              <input type="text" value={form.brand} onChange={e => setForm({...form, brand:e.target.value})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input type="text" value={form.model} onChange={e => setForm({...form, model:e.target.value})} className="input input-sm" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spesifikasi</label>
            <textarea value={form.specs} onChange={e => setForm({...form, specs:e.target.value})} rows={2} placeholder="DDR4 3200MHz, SODIMM" className="textarea" style={{ minHeight:60 }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Kondisi</label>
              <select value={form.condition} onChange={e => setForm({...form, condition:e.target.value as 'baru' | 'bekas' | 'refurbished'})} className="select select-sm">
                <option value="baru">Baru</option><option value="bekas">Bekas</option><option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stok Awal *</label>
              <input type="number" required min={0} value={form.quantity} onChange={e => setForm({...form, quantity:Number(e.target.value)})} className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Harga Beli *</label>
              <input type="number" required min={0} value={form.buy_price || ''} onChange={e => setForm({...form, buy_price:Number(e.target.value)})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Harga Jual</label>
              <input type="number" min={0} value={form.sell_price || ''} onChange={e => setForm({...form, sell_price:Number(e.target.value)})} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Min. Stok</label>
              <input type="number" min={0} value={form.min_quantity} onChange={e => setForm({...form, min_quantity:Number(e.target.value)})} className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'flex', gap:8, paddingTop:8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex:1 }}>{loading ? 'Menyimpan...' : 'Simpan Barang'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Adjust Stock Form ─────────────────────────── */
function AdjustStokForm({ product, onClose, onSaved, userId }: {
  product: Product; onClose: () => void; onSaved: () => void; userId?: string;
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<'masuk' | 'keluar'>('masuk')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const newQty = type === 'masuk' ? product.quantity + quantity : product.quantity - quantity
      if (newQty < 0) { setError('Stok tidak cukup'); setLoading(false); return }
      const { error: updateError } = await supabase.from('products').update({ quantity: newQty }).eq('id', product.id)
      if (updateError) throw updateError
      await supabase.from('stock_movements').insert({
        product_id: product.id, type, quantity, reference_type:'adjustment',
        notes: notes || `Penyesuaian stok ${type}`, created_by: userId,
      })
      onSaved(); onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400, padding:24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <h2 className="text-h2">Penyesuaian Stok</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width:32, height:32, padding:0 }}><X size={16} /></button>
        </div>
        <p style={{ fontSize:13, color:'var(--mute)', marginBottom:20 }}>{product.name} — Stok saat ini: <strong style={{ color:'var(--ink)' }}>{product.quantity}</strong></p>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <button type="button"
              style={{
                padding:'14px 8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500,
                border: type === 'masuk' ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                background: type === 'masuk' ? 'var(--info-bg)' : 'var(--surface)',
                color: type === 'masuk' ? 'var(--primary)' : 'var(--mute)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                transition:'all 150ms ease',
              }} onClick={() => setType('masuk')}
            >
              <ArrowDown size={16} />
              Stok Masuk
            </button>
            <button type="button"
              style={{
                padding:'14px 8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500,
                border: type === 'keluar' ? '1.5px solid var(--danger)' : '1px solid var(--border-strong)',
                background: type === 'keluar' ? 'var(--danger-bg)' : 'var(--surface)',
                color: type === 'keluar' ? 'var(--danger)' : 'var(--mute)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                transition:'all 150ms ease',
              }} onClick={() => setType('keluar')}
            >
              <ArrowUp size={16} />
              Stok Keluar
            </button>
          </div>

          <div>
            <label style={labelStyle}>Jumlah *</label>
            <input type="number" required min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input input-sm" />
          </div>

          <div>
            <label style={labelStyle}>Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Keterangan..." className="textarea" style={{ minHeight:60 }} />
          </div>

          <div style={{ padding:'10px 14px', background:'var(--surface-muted)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'var(--mute)' }}>Stok setelah</span>
            <span style={{ fontSize:15, fontWeight:600, color: type === 'masuk' ? 'var(--success)' : 'var(--danger)' }}>
              {type === 'masuk' ? product.quantity + quantity : product.quantity - quantity}
            </span>
          </div>

          <div style={{ display:'flex', gap:8, paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className={`btn ${type === 'masuk' ? 'btn-success' : 'btn-danger'}`} style={{ flex:1 }}>
              {loading ? 'Menyimpan...' : type === 'masuk' ? 'Tambah Stok' : 'Kurangi Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
