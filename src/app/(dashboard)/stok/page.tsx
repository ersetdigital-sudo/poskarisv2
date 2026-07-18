'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, ArrowDown, ArrowUp, AlertTriangle, Plus, Package, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/dashboard/PageHeader'

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
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { fetchData(); fetchCategories() }, [])

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100),
      ])
      setProducts(prodRes.data || [])
      setMovements(movRes.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function fetchCategories() {
    try {
      const { data } = await supabase.from('categories').select('id, name').order('name')
      setCategories(data || [])
    } catch (e) { console.error(e) }
  }

  const filtered = products.filter(p => {
    const catName = (p as Product & { categories?: { name: string } }).categories?.name || ''
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || catName === filterCategory
    return matchSearch && matchCategory
  })

  const lowStock = products.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0)
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Stok Barang"
        subtitle="Kelola stok unit laptop dan sparepart"
      >
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddCategoryForm(true)} className="gap-2">
            <Plus size={16} strokeWidth={2} />
            Kategori
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus size={16} strokeWidth={2} />
            Tambah Stok
          </Button>
        </div>
      </PageHeader>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="shadow-card border-l-4 border-l-badge-warning">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-badge-warning/10 flex-shrink-0">
                <AlertTriangle size={16} className="text-badge-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink mb-1.5">Stok Menipis</p>
                <div className="flex flex-wrap gap-2">
                  {lowStock.map(p => (
                    <Badge key={p.id} variant="warning" className="text-[10px] px-2 py-0.5">
                      {p.name} ({p.quantity})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[240px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <Input 
                type="text" 
                placeholder="Cari nama atau SKU..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)} 
              className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm w-[180px]"
            >
              <option value="all">Semua Kategori</option>
              <option value="Unit Laptop">Unit Laptop</option>
              <option value="Sparepart">Sparepart</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-secondary/30">
                  <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Barang</th>
                  <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Kategori</th>
                  <th className="text-center p-4 text-xs font-medium text-ash uppercase tracking-wide">Stok</th>
                  <th className="text-right p-4 text-xs font-medium text-ash uppercase tracking-wide">Harga Beli</th>
                  <th className="text-right p-4 text-xs font-medium text-ash uppercase tracking-wide">Harga Jual</th>
                  <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Status</th>
                  <th className="text-center p-4 text-xs font-medium text-ash uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12">
                      <Package size={32} className="text-stone mx-auto mb-2" />
                      <p className="text-xs text-stone">Belum ada data stok</p>
                    </td>
                  </tr>
                ) : filtered.map(p => {
                  const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
                  const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
                  const statusVariant = p.status === 'ready' ? 'success' : p.status === 'sold' ? 'secondary' : 'default'
                  
                  return (
                    <tr 
                      key={p.id} 
                      className={`border-b border-hairline hover:bg-secondary/30 transition-colors ${isLow ? 'bg-badge-warning/5' : ''}`}
                    >
                      <td className="p-4">
                        <p className="text-sm font-semibold text-ink">{p.name}</p>
                        <p className="text-[10px] text-stone font-mono mt-0.5">{p.sku || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-charcoal">{catName}</p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-sm font-bold ${isLow ? 'text-badge-warning' : 'text-ink'}`}>
                            {p.quantity}
                          </span>
                          {isLow && <AlertTriangle size={12} className="text-badge-warning" />}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-xs font-semibold text-ink font-mono">{formatRupiah(p.buy_price)}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-xs font-bold text-ink font-mono">{formatRupiah(p.sell_price)}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusVariant as any} className="text-[10px] px-2 py-0.5 capitalize">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setAdjustProduct(p)}
                            className="h-7 px-2 gap-1"
                          >
                            <Plus size={12} />
                            <span className="text-[11px]">Stok</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedProduct(p)}
                            className="h-7 px-2"
                          >
                            <span className="text-[11px]">Mutasi</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mutasi Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <Card className="w-full max-w-md shadow-elevated" onClick={e => e.stopPropagation()}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-base font-bold text-ink" style={{ fontWeight: 700 }}>Mutasi Stok</h2>
                  <p className="text-xs text-stone mt-1">
                    {selectedProduct.name} — Stok: <span className="font-bold text-ink">{selectedProduct.quantity}</span>
                  </p>
                </div>
                <Button onClick={() => setSelectedProduct(null)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X size={16} />
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {movements.filter(m => m.product_id === selectedProduct.id).map(m => (
                  <div 
                    key={m.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-hairline hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      m.type === 'masuk' ? 'bg-badge-success/10' : 'bg-danger/10'
                    }`}>
                      {m.type === 'masuk' ? (
                        <ArrowDown size={14} className="text-badge-success" />
                      ) : (
                        <ArrowUp size={14} className="text-danger" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {m.type === 'masuk' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-[10px] text-stone truncate">{m.notes || m.reference_type}</p>
                    </div>
                    <span className="text-[10px] text-stone whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
                {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-stone">Belum ada mutasi stok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddForm && <AddStokForm onClose={() => setShowAddForm(false)} onSaved={fetchData} userId={user?.id} onCategoryAdded={fetchCategories} />}
      {adjustProduct && <AdjustStokForm product={adjustProduct} onClose={() => setAdjustProduct(null)} onSaved={fetchData} userId={user?.id} />}
      {showAddCategoryForm && (
        <AddCategoryForm
          existingCategories={categories}
          onClose={() => setShowAddCategoryForm(false)}
          onSaved={() => { fetchCategories(); fetchData() }}
        />
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--color-ash)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

/* ── Add Product Form ─────────────────────────── */
function AddStokForm({ onClose, onSaved, userId, onCategoryAdded }: { onClose: () => void; onSaved: () => void; userId?: string; onCategoryAdded?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showCatForm, setShowCatForm] = useState(false)
  const [form, setForm] = useState({
    category_id: '', name: '', sku: '', brand: '', model: '', specs: '',
    condition: 'baru' as 'baru' | 'bekas' | 'refurbished',
    buy_price: 0, sell_price: 0, quantity: 1, min_quantity: 0,
  })

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    setCategories(data || [])
  }

  useEffect(() => { loadCategories() }, [])

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
      if (form.quantity > 0) {
        const { data: prod } = await supabase.from('products').select('id').eq('name', form.name).order('created_at', { ascending: false }).limit(1).single()
        if (prod) await supabase.from('stock_movements').insert({ product_id: prod.id, type: 'masuk', quantity: form.quantity, reference_type: 'adjustment', notes: `Stok awal ${form.name}`, created_by: userId })
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h2 className="text-h2">Tambah Stok Barang</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)', marginTop: 2 }}>Tambah barang baru ke inventaris</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}><X size={16} /></button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div>
            <label style={labelStyle}>Kategori *</label>
            <div style={{ display: 'flex', gap: 'var(--space-2xs)' }}>
              <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="select select-sm" style={{ flex: 1 }}>
                <option value="">Pilih kategori...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowCatForm(true)} className="btn btn-secondary btn-sm" title="Tambah kategori baru">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
            <div>
              <label style={labelStyle}>Nama Barang *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RAM 8GB DDR4" className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="input input-sm" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
            <div>
              <label style={labelStyle}>Merk</label>
              <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input input-sm" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spesifikasi</label>
            <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} rows={2} placeholder="DDR4 3200MHz, SODIMM" className="textarea" style={{ minHeight: 60 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-xs)' }}>
            <div>
              <label style={labelStyle}>Harga Beli *</label>
              <input type="number" required min={0} value={form.buy_price || ''} onChange={e => setForm({ ...form, buy_price: Number(e.target.value) })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Harga Jual</label>
              <input type="number" min={0} value={form.sell_price || ''} onChange={e => setForm({ ...form, sell_price: Number(e.target.value) })} className="input input-sm" />
            </div>
            <div>
              <label style={labelStyle}>Min. Stok</label>
              <input type="number" min={0} value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} className="input input-sm" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 'var(--space-2xs)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Menyimpan...' : 'Simpan Barang'}</button>
          </div>
        </form>

        {showCatForm && (
          <InlineAddCategory
            onClose={() => setShowCatForm(false)}
            onSaved={() => { loadCategories(); onCategoryAdded?.() }}
          />
        )}
      </div>
    </div>
  )
}

/* ── Inline Add Category (inside AddStokForm) ──── */
function InlineAddCategory({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.from('categories').insert({ name: form.name, description: form.description || null })
      if (error) throw error
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 'var(--z-popover)' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h2 className="text-h2" style={{ fontSize: 'var(--text-h3)' }}>Tambah Kategori Baru</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 28, height: 28, padding: 0 }}><X size={14} /></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-xs)' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <div>
            <label style={labelStyle}>Nama Kategori *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aksesoris, Adapter, dll" className="input input-sm" />
          </div>
          <div>
            <label style={labelStyle}>Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="textarea" style={{ minHeight: 56 }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ flex: 1 }}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
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
        product_id: product.id, type, quantity, reference_type: 'adjustment',
        notes: notes || `Penyesuaian stok ${type}`, created_by: userId,
      })
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 className="text-h2">Penyesuaian Stok</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)', marginBottom: 'var(--space-lg)' }}>{product.name} — Stok saat ini: <strong style={{ color: 'var(--color-ink)' }}>{product.quantity}</strong></p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xs)' }}>
            <button type="button"
              style={{
                padding: 'var(--space-sm) var(--space-2xs)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 500,
                border: type === 'masuk' ? '1.5px solid var(--color-accent)' : '1px solid var(--color-rule-strong)',
                background: type === 'masuk' ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                color: type === 'masuk' ? 'var(--color-accent)' : 'var(--color-ink-3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all var(--dur-short) var(--ease-out)',
              }} onClick={() => setType('masuk')}
            >
              <ArrowDown size={16} />
              Stok Masuk
            </button>
            <button type="button"
              style={{
                padding: 'var(--space-sm) var(--space-2xs)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 500,
                border: type === 'keluar' ? '1.5px solid var(--color-danger)' : '1px solid var(--color-rule-strong)',
                background: type === 'keluar' ? 'var(--color-danger-bg)' : 'var(--color-paper-2)',
                color: type === 'keluar' ? 'var(--color-danger)' : 'var(--color-ink-3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all var(--dur-short) var(--ease-out)',
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
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Keterangan..." className="textarea" style={{ minHeight: 60 }} />
          </div>

          <div style={{
            padding: 'var(--space-xs) var(--space-sm)', background: 'var(--color-paper-3)',
            borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Stok setelah</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600,
              color: type === 'masuk' ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
              {type === 'masuk' ? product.quantity + quantity : product.quantity - quantity}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={loading} className={`btn ${type === 'masuk' ? 'btn-success' : 'btn-danger'}`} style={{ flex: 1 }}>
              {loading ? 'Menyimpan...' : type === 'masuk' ? 'Tambah Stok' : 'Kurangi Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Add Category Form (standalone modal) ──────── */
function AddCategoryForm({ existingCategories, onClose, onSaved }: {
  existingCategories: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.from('categories').insert({ name: form.name, description: form.description || null })
      if (error) throw error
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 className="text-h2">Tambah Kategori</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)', marginBottom: 'var(--space-lg)' }}>Kategori untuk mengelompokkan produk</p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div>
            <label style={labelStyle}>Nama Kategori *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aksesoris, Adapter, dll" className="input input-sm" />
          </div>
          <div>
            <label style={labelStyle}>Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Keterangan kategori..." className="textarea" style={{ minHeight: 60 }} />
          </div>

          {existingCategories.length > 0 && (
            <div style={{ padding: 'var(--space-xs) var(--space-sm)', background: 'var(--color-paper-3)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 6 }}>Kategori yang sudah ada:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {existingCategories.map(c => <span key={c.id} className="badge badge-neutral">{c.name}</span>)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2xs)', paddingTop: 'var(--space-2xs)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Menyimpan...' : 'Simpan Kategori'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
