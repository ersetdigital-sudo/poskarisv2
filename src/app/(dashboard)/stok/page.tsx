'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, ArrowDown, ArrowUp, AlertTriangle, Plus, Package } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:500, color:'var(--charcoal)', marginBottom:6,
}

export default function StokPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showMovements, setShowMovements] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAdjustForm, setShowAdjustForm] = useState(false)
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

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Stok Barang</h1>
          <p style={{ fontSize:14, color:'var(--mute)' }}>Kelola stok unit laptop dan sparepart</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          <Plus size={16} /> Tambah Stok Barang
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom:16 }}>
          <AlertTriangle size={18} />
          <div>
            <p style={{ fontWeight:600, marginBottom:6 }}>Stok Menipis</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {lowStock.map(p => (
                <span key={p.id} className="badge badge-warning">{p.name} ({p.quantity})</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--stone)' }} />
          <input type="text" placeholder="Cari nama barang atau SKU..." value={search} onChange={e => setSearch(e.target.value)} className="input input-sm" style={{ paddingLeft:40 }} />
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
            <thead>
              <tr>
                <th>Barang</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}>
                  <Package size={32} style={{ color:'var(--stone)', margin:'0 auto 8px', display:'block' }} />
                  <p style={{ color:'var(--mute)' }}>Belum ada data stok</p>
                </td></tr>
              ) : filtered.map(p => {
                const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
                const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
                const statusClass = p.status === 'ready' ? 'badge-success' : p.status === 'sold' ? 'badge-primary' : p.status === 'reserved' ? 'badge-warning' : 'badge-neutral'
                return (
                  <tr key={p.id} style={{ background: isLow ? 'var(--warning-bg)' : undefined }}>
                    <td>
                      <p style={{ fontWeight:500, color:'var(--ink)' }}>{p.name}</p>
                      <p style={{ fontSize:12, color:'var(--mute)' }}>{p.sku || '-'}</p>
                    </td>
                    <td style={{ color:'var(--charcoal)' }}>{catName}</td>
                    <td>
                      <span style={{ fontWeight:600, color: isLow ? 'var(--warning-text)' : 'var(--ink)' }}>{p.quantity}</span>
                      {isLow && <AlertTriangle size={12} style={{ marginLeft:4, color:'var(--warning)' }} />}
                    </td>
                    <td style={{ color:'var(--charcoal)' }}>{formatRupiah(p.buy_price)}</td>
                    <td style={{ color:'var(--charcoal)' }}>{formatRupiah(p.sell_price)}</td>
                    <td><span className={`badge ${statusClass}`}>{p.status}</span></td>
                    <td>
                      <button className="btn-ghost btn-xs" onClick={() => { setAdjustProduct(p); setShowAdjustForm(true) }}>
                        <Plus size={12} /> Stok
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <AddStokForm onClose={() => setShowAddForm(false)} onSaved={fetchData} userId={user?.id} />
      )}

      {/* Adjust Stock Modal */}
      {showAdjustForm && adjustProduct && (
        <AdjustStokForm product={adjustProduct} onClose={() => { setShowAdjustForm(false); setAdjustProduct(null) }} onSaved={fetchData} userId={user?.id} />
      )}

      {/* Stock Movement Modal */}
      {showMovements && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowMovements(false)}>
          <div className="modal" style={{ maxWidth:480, padding:24 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:18, fontWeight:600, color:'var(--ink)', marginBottom:6 }}>Mutasi Stok</h2>
            <p style={{ fontSize:14, color:'var(--mute)', marginBottom:20 }}>{selectedProduct.name} — Stok: <strong>{selectedProduct.quantity}</strong></p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto' }}>
              {movements.filter(m => m.product_id === selectedProduct.id).map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:8, border:'1px solid var(--hairline)' }}>
                  {m.type === 'masuk' ? <ArrowDown size={16} style={{ color:'var(--success-text)' }} /> : <ArrowUp size={16} style={{ color:'var(--danger-text)' }} />}
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{m.type === 'masuk' ? '+' : '-'}{m.quantity}</p>
                    <p style={{ fontSize:12, color:'var(--mute)' }}>{m.notes || m.reference_type}</p>
                  </div>
                  <span style={{ fontSize:12, color:'var(--stone)' }}>{new Date(m.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
              {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
                <p style={{ padding:24, textAlign:'center', color:'var(--mute)' }}>Belum ada mutasi stok</p>
              )}
            </div>
            <button onClick={() => setShowMovements(false)} className="btn-ghost" style={{ width:'100%', marginTop:16 }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Add New Product Form ──────────────────────── */
function AddStokForm({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    category_id: '', name: '', sku: '', brand: '', model: '', specs: '',
    condition: 'baru' as 'baru' | 'bekas' | 'refurbished',
    buy_price: 0, sell_price: 0, quantity: 1, min_quantity: 0,
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
        quantity: form.quantity, min_quantity: form.min_quantity, status: 'ready',
      })
      if (error) throw error

      // Record stock movement
      if (form.quantity > 0) {
        const { data: prod } = await supabase.from('products').select('id').eq('name', form.name).order('created_at', { ascending:false }).limit(1).single()
        if (prod) {
          await supabase.from('stock_movements').insert({
            product_id: prod.id, type: 'masuk', quantity: form.quantity,
            reference_type: 'adjustment', notes: `Stok awal ${form.name}`, created_by: userId,
          })
        }
      }

      onSaved(); onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560, padding:28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:20, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.4px', marginBottom:4 }}>Tambah Stok Barang</h2>
        <p style={{ fontSize:13, color:'var(--mute)', marginBottom:24 }}>Tambah barang baru ke inventaris</p>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>Kategori *</label>
            <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="select select-sm">
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Nama Barang *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RAM 8GB DDR4" className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Merk / Brand</label>
              <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Tipe / Model</label>
              <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input input-sm" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spesifikasi</label>
            <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} rows={2} placeholder="DDR4 3200MHz, SODIMM" className="textarea" style={{ minHeight:72 }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Kondisi</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })} className="select select-sm">
                <option value="baru">Baru</option><option value="bekas">Bekas</option><option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stok Awal *</label>
              <input type="number" required min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Harga Beli (Rp) *</label>
              <input type="number" required min={0} value={form.buy_price || ''} onChange={e => setForm({ ...form, buy_price: Number(e.target.value) })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Harga Jual (Rp)</label>
              <input type="number" min={0} value={form.sell_price || ''} onChange={e => setForm({ ...form, sell_price: Number(e.target.value) })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Min. Stok</label>
              <input type="number" min={0} value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} className="input input-sm" />
            </div>
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex:1 }}>
              {loading ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
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
        product_id: product.id, type, quantity,
        reference_type: 'adjustment', notes: notes || `Penyesuaian stok ${type}`,
        created_by: userId,
      })

      onSaved(); onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:420, padding:28 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:18, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Penyesuaian Stok</h2>
        <p style={{ fontSize:13, color:'var(--mute)', marginBottom:20 }}>{product.name} — Stok saat ini: <strong>{product.quantity}</strong></p>

        {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <button type="button"
              style={{
                padding:'12px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600,
                border: type === 'masuk' ? '2px solid var(--success)' : '1.5px solid var(--hairline)',
                background: type === 'masuk' ? 'var(--success-bg)' : 'var(--surface)',
                color: type === 'masuk' ? 'var(--success-text)' : 'var(--mute)',
                transition:'all 180ms ease',
              }}
              onClick={() => setType('masuk')}
            >
              <ArrowDown size={16} style={{ marginBottom:4 }} /><br/>Stok Masuk
            </button>
            <button type="button"
              style={{
                padding:'12px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600,
                border: type === 'keluar' ? '2px solid var(--danger)' : '1.5px solid var(--hairline)',
                background: type === 'keluar' ? 'var(--danger-bg)' : 'var(--surface)',
                color: type === 'keluar' ? 'var(--danger-text)' : 'var(--mute)',
                transition:'all 180ms ease',
              }}
              onClick={() => setType('keluar')}
            >
              <ArrowUp size={16} style={{ marginBottom:4 }} /><br/>Stok Keluar
            </button>
          </div>

          <div>
            <label style={labelStyle}>Jumlah *</label>
            <input type="number" required min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input input-sm" />
          </div>

          <div>
            <label style={labelStyle}>Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Keterangan penyesuaian..." className="textarea" style={{ minHeight:72 }} />
          </div>

          <div style={{ background:'var(--background-bone)', borderRadius:10, padding:'12px 16px' }}>
            <p style={{ fontSize:13, color:'var(--charcoal)' }}>
              Stok setelah:{' '}
              <strong style={{ color: type === 'masuk' ? 'var(--success-text)' : 'var(--danger-text)' }}>
                {type === 'masuk' ? product.quantity + quantity : product.quantity - quantity}
              </strong>
            </p>
          </div>

          <div style={{ display:'flex', gap:12, paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Batal</button>
            <button type="submit" disabled={loading} className={type === 'masuk' ? 'btn-success' : 'btn-danger'} style={{ flex:1 }}>
              {loading ? 'Menyimpan...' : type === 'masuk' ? 'Tambah Stok' : 'Kurangi Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
