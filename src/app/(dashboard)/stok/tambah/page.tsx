'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'
import { showToast } from '@/components/ui/toast'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

export default function TambahStokPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [form, setForm] = useState({
    category_id: '', name: '', sku: '', brand: '', model: '', specs: '',
    condition: 'baru' as 'baru' | 'bekas' | 'refurbished',
    buy_price: 0, sell_price: 0, quantity: 1, min_quantity: 0,
  })

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    const unique = (data || []).reduce((acc, cat) => {
      const key = cat.name.toLowerCase().trim()
      if (!acc.has(key)) acc.set(key, cat)
      return acc
    }, new Map<string, { id: string; name: string }>())
    setCategories(Array.from(unique.values()))
  }

  useEffect(() => { loadCategories() }, [])

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

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
        if (prod) await supabase.from('stock_movements').insert({ product_id: prod.id, type: 'masuk', quantity: form.quantity, reference_type: 'adjustment', notes: `Stok awal ${form.name}`, created_by: user?.id })
      }
      showToast('Barang berhasil ditambahkan', 'success')
      router.push('/stok')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    setCatLoading(true)
    setCatError('')
    try {
      const { error } = await supabase.from('categories').insert({ name: catForm.name, description: catForm.description || null })
      if (error) throw error
      setCatForm({ name: '', description: '' })
      setShowCatForm(false)
      loadCategories()
      showToast('Kategori berhasil ditambahkan', 'success')
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    } finally { setCatLoading(false) }
  }

  return (
    <div className="space-y-3">
      {/* Back + header - SAMA PERSIS kaya Beli Unit */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Tambah Stok Barang</h1>
          <p className="text-xs text-muted-foreground">Tambah sparepart atau unit laptop baru ke stok</p>
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
              {/* Kategori - field khusus Tambah Stok */}
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

              {/* Merk & Model - SAMA PERSIS kaya Beli Unit */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Merk *</label>
                  <Input type="text" required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Kingston, Samsung" className="h-10 w-full" />
                </div>
                <div>
                  <label className={labelClass}>Tipe/Model *</label>
                  <Input type="text" required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="h-10 w-full" />
                </div>
              </div>

              {/* Spesifikasi - SAMA PERSIS kaya Beli Unit */}
              <div>
                <label className={labelClass}>Spesifikasi</label>
                <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} placeholder="RAM 8GB, SSD 256GB, DDR4 3200MHz" rows={2} className={textareaClass} />
              </div>

              {/* Kondisi & Nama Barang - SAMA PERSIS kaya Beli Unit (Kondisi & IMEI/SN) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Kondisi *</label>
                  <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })} className={selectClass}>
                    <option value="baru">Baru</option><option value="bekas">Bekas</option><option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nama Barang *</label>
                  <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RAM 8GB DDR4 SODIMM" className="h-10 w-full" />
                </div>
              </div>

              {/* Harga Beli & Harga Jual - SAMA PERSIS kaya Beli Unit */}
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

              {/* Potensi Margin - SAMA PERSIS kaya Beli Unit */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                <span className="text-sm text-muted-foreground">Potensi Margin</span>
                <span className="font-mono text-base font-bold text-badge-success">{formatRupiah(form.sell_price - form.buy_price)}</span>
              </div>

              {/* Stok & SKU - section tambahan untuk Tambah Stok */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Informasi Stok</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>SKU</label>
                    <Input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="h-10 w-full font-mono" />
                  </div>
                  <div>
                    <label className={labelClass}>Stok Awal *</label>
                    <Input type="number" required min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="h-10 w-full" />
                  </div>
                  <div>
                    <label className={labelClass}>Min. Stok</label>
                    <Input type="number" min={0} value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} className="h-10 w-full" />
                  </div>
                </div>
              </div>

              {/* Submit - SAMA PERSIS kaya Beli Unit */}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
                <Button type="button" onClick={() => router.back()} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Barang'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Inline Add Category Modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCatForm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-elevated" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Tambah Kategori Baru</h2>
              <Button onClick={() => setShowCatForm(false)} variant="ghost" size="sm" className="h-7 w-7 p-0">✕</Button>
            </div>
            {catError && (
              <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5">
                <p className="text-xs text-destructive">{catError}</p>
              </div>
            )}
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className={labelClass}>Nama Kategori *</label>
                <Input type="text" required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Aksesoris, Adapter, dll" className="h-10 w-full" />
              </div>
              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} className={textareaClass} />
              </div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <Button type="button" onClick={() => setShowCatForm(false)} variant="secondary" className="h-10 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={catLoading} className="h-10 w-full sm:flex-1">{catLoading ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
