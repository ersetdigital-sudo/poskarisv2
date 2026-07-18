'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, ArrowDown, ArrowUp, AlertTriangle, Plus, Package, X, Cpu, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RupiahInput } from '@/components/ui/rupiah-input'
import PageHeader from '@/components/dashboard/PageHeader'

type TabType = 'sparepart' | 'unit'

export default function StokPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('sparepart')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showMutasiLog, setShowMutasiLog] = useState(false)

  useEffect(() => { fetchData(); fetchCategories() }, [])

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*, products(name, categories(name))').order('created_at', { ascending: false }).limit(200),
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

  // Filter products by tab
  const filteredByTab = products.filter(p => {
    const catName = (p as Product & { categories?: { name: string } }).categories?.name || ''
    if (activeTab === 'sparepart') return catName === 'Sparepart'
    return catName === 'Unit Laptop'
  })

  const filtered = filteredByTab.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  // Filter movements by tab category
  const filteredMovements = movements.filter(m => {
    const prod = m as StockMovement & { products?: { name: string; categories?: { name: string } } }
    const catName = prod.products?.categories?.name || ''
    if (activeTab === 'sparepart') return catName === 'Sparepart'
    return catName === 'Unit Laptop'
  })

  const lowStock = filteredByTab.filter(p => p.quantity <= p.min_quantity && p.min_quantity > 0)
  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Stok Barang"
        subtitle={activeTab === 'sparepart' ? 'Kelola stok sparepart untuk servis' : 'Kelola stok unit laptop untuk dijual'}
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('sparepart'); setSearch('') }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'sparepart'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'
          }`}
        >
          <Wrench size={16} />
          Sparepart
        </button>
        <button
          onClick={() => { setActiveTab('unit'); setSearch('') }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'unit'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:bg-secondary/50 border border-border'
          }`}
        >
          <Cpu size={16} />
          Unit Laptop
        </button>
        <div className="flex-1" />
        <Button 
          variant="outline" 
          onClick={() => setShowMutasiLog(true)}
          className="gap-2"
        >
          <ArrowDown size={14} />
          Catatan Stok
        </Button>
      </div>

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

      {/* Search Filter */}
      <Card className="shadow-card">
        <CardContent className="p-2.5 sm:p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
            <Input 
              type="text" 
              placeholder={`Cari ${activeTab === 'sparepart' ? 'sparepart' : 'unit laptop'}...`} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-2">
        {filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Package size={24} className="text-stone mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada data stok</p>
            </CardContent>
          </Card>
        ) : filtered.map(p => {
          const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
          const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
          const statusVariant = p.status === 'ready' ? 'success' : p.status === 'sold' ? 'secondary' : 'default'
          
          return (
            <Card key={p.id} className={`shadow-card overflow-hidden ${isLow ? 'border-l-4 border-l-badge-warning' : ''}`}>
              <CardContent className="p-0">
                <div className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-[10px] text-stone font-mono">{p.sku || '-'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant as any} className="text-[10px] px-1.5 py-0.5 capitalize">
                        {p.status}
                      </Badge>
                      {isLow && <AlertTriangle size={14} className="text-badge-warning" />}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs mb-2">
                    <span className="text-muted-foreground">{catName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className={`font-bold ${isLow ? 'text-badge-warning' : 'text-ink'}`}>
                      Stok: {p.quantity}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <span className="text-muted-foreground">Beli: <span className="font-mono font-medium text-ink">{formatRupiah(p.buy_price)}</span></span>
                      <span className="text-muted-foreground">Jual: <span className="font-mono font-medium text-ink">{formatRupiah(p.sell_price)}</span></span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAdjustProduct(p)}
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      <Plus size={12} /> Stok
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
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
      </div>

      {/* Mutasi Modal */}
      {selectedProduct && (
        <Modal title="Mutasi Stok" onClose={() => setSelectedProduct(null)} maxWidth="md">
          <p className="mb-3 -mt-1 text-xs text-muted-foreground">
            {selectedProduct.name} — Stok: <span className="font-bold text-foreground">{selectedProduct.quantity}</span>
          </p>

          <div className="space-y-2">
            {movements.filter(m => m.product_id === selectedProduct.id).map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.type === 'masuk' ? 'bg-badge-success/10' : 'bg-destructive/10'
                }`}>
                  {m.type === 'masuk' ? (
                    <ArrowDown size={14} className="text-badge-success" />
                  ) : (
                    <ArrowUp size={14} className="text-destructive" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {m.type === 'masuk' ? '+' : '-'}{m.quantity}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{m.notes || m.reference_type}</p>
                </div>
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
            {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Belum ada mutasi stok</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Catatan Stok Modal (Mutasi Log) */}
      {showMutasiLog && (
        <Modal 
          title={`Catatan Stok ${activeTab === 'sparepart' ? 'Sparepart' : 'Unit Laptop'}`} 
          onClose={() => setShowMutasiLog(false)} 
          maxWidth="2xl"
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredMovements.length === 0 ? (
              <div className="py-8 text-center">
                <Package size={24} className="text-stone mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Belum ada catatan stok</p>
              </div>
            ) : filteredMovements.map(m => {
              const prod = m as StockMovement & { products?: { name: string } }
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    m.type === 'masuk' ? 'bg-badge-success/10' : 'bg-destructive/10'
                  }`}>
                    {m.type === 'masuk' ? (
                      <ArrowDown size={16} className="text-badge-success" />
                    ) : (
                      <ArrowUp size={16} className="text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {m.type === 'masuk' ? '+' : '-'}{m.quantity}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs font-medium text-foreground truncate">{prod.products?.name || '-'}</p>
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                      {m.notes || m.reference_type}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {showAddForm && <AddStokForm onClose={() => setShowAddForm(false)} onSaved={fetchData} userId={user?.id} onCategoryAdded={fetchCategories} defaultCategory={activeTab === 'sparepart' ? 'Sparepart' : 'Unit Laptop'} />}
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

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

/* ── Add Product Form ─────────────────────────── */
function AddStokForm({ onClose, onSaved, userId, onCategoryAdded, defaultCategory }: { 
  onClose: () => void; onSaved: () => void; userId?: string; onCategoryAdded?: () => void;
  defaultCategory?: string;
}) {
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
    // Auto-select category based on active tab
    if (defaultCategory && data) {
      const cat = data.find(c => c.name === defaultCategory)
      if (cat) setForm(f => ({ ...f, category_id: cat.id }))
    }
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
    <>
      <Modal title="Tambah Stok Barang" onClose={onClose} maxWidth="xl">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Kategori *</label>
            <div className="flex gap-2">
              <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={selectClass}>
                <option value="">Pilih kategori...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button type="button" variant="secondary" onClick={() => setShowCatForm(true)} title="Tambah kategori baru" className="h-10 w-10 shrink-0 p-0">
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama Barang *</label>
              <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RAM 8GB DDR4" className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>SKU</label>
              <Input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="h-10 w-full font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Merk</label>
              <Input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="h-10 w-full" />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <Input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="h-10 w-full" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Spesifikasi</label>
            <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} rows={2} placeholder="DDR4 3200MHz, SODIMM" className={textareaClass} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Kondisi</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })} className={selectClass}>
                <option value="baru">Baru</option><option value="bekas">Bekas</option><option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Stok Awal *</label>
              <Input type="number" required min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="h-10 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Harga Beli (Rp) *</label>
              <RupiahInput value={form.buy_price} onChange={v => setForm({ ...form, buy_price: v })} className="h-10 w-full font-mono" />
            </div>
            <div>
              <label className={labelClass}>Harga Jual (Rp)</label>
              <RupiahInput value={form.sell_price} onChange={v => setForm({ ...form, sell_price: v })} className="h-10 w-full font-mono" />
            </div>
            <div>
              <label className={labelClass}>Min. Stok</label>
              <Input type="number" min={0} value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} className="h-10 w-full" />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
            <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
            <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Barang'}</Button>
          </div>
        </form>
      </Modal>

      {showCatForm && (
        <InlineAddCategory
          onClose={() => setShowCatForm(false)}
          onSaved={() => { loadCategories(); onCategoryAdded?.() }}
        />
      )}
    </>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-elevated" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Tambah Kategori Baru</h2>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="Tutup" className="h-7 w-7 p-0"><X size={14} /></Button>
        </div>
        {error && (
          <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Nama Kategori *</label>
            <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aksesoris, Adapter, dll" className="h-10 w-full" />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={textareaClass} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
            <Button type="button" onClick={onClose} variant="secondary" className="h-10 w-full sm:flex-1">Batal</Button>
            <Button type="submit" disabled={loading} className="h-10 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan'}</Button>
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
    <Modal title="Penyesuaian Stok" onClose={onClose} maxWidth="sm">
      <p className="mb-4 -mt-1 text-sm text-muted-foreground">
        {product.name} — Stok saat ini: <strong className="text-foreground">{product.quantity}</strong>
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('masuk')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors ${
              type === 'masuk'
                ? 'border-badge-success bg-badge-success/10 text-badge-success'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <ArrowDown size={16} />
            Stok Masuk
          </button>
          <button
            type="button"
            onClick={() => setType('keluar')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors ${
              type === 'keluar'
                ? 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <ArrowUp size={16} />
            Stok Keluar
          </button>
        </div>

        <div>
          <label className={labelClass}>Jumlah *</label>
          <Input type="number" required min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="h-10 w-full" />
        </div>

        <div>
          <label className={labelClass}>Catatan</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Keterangan..." className={textareaClass} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
          <span className="text-sm text-muted-foreground">Stok setelah</span>
          <span className={`text-lg font-bold ${type === 'masuk' ? 'text-badge-success' : 'text-destructive'}`}>
            {type === 'masuk' ? product.quantity + quantity : product.quantity - quantity}
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
          <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
          <Button
            type="submit"
            disabled={loading}
            variant={type === 'masuk' ? 'default' : 'destructive'}
            className="h-11 w-full sm:flex-1"
          >
            {loading ? 'Menyimpan...' : type === 'masuk' ? 'Tambah Stok' : 'Kurangi Stok'}
          </Button>
        </div>
      </form>
    </Modal>
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
    <Modal title="Tambah Kategori" onClose={onClose} maxWidth="md">
      <p className="mb-4 -mt-1 text-sm text-muted-foreground">Kategori untuk mengelompokkan produk</p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nama Kategori *</label>
          <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aksesoris, Adapter, dll" className="h-10 w-full" />
        </div>
        <div>
          <label className={labelClass}>Deskripsi</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Keterangan kategori..." className={textareaClass} />
        </div>

        {existingCategories.length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Kategori yang sudah ada:</p>
            <div className="flex flex-wrap gap-1.5">
              {existingCategories.map(c => <Badge key={c.id} variant="secondary" className="text-[10px]">{c.name}</Badge>)}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
          <Button type="button" onClick={onClose} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
          <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Kategori'}</Button>
        </div>
      </form>
    </Modal>
  )
}
