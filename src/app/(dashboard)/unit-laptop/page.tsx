'use client'

import { useEffect, useState } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { Search, ShoppingCart, ArrowDownToLine } from 'lucide-react'
import Link from 'next/link'

export default function UnitLaptopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').single()
      if (!cat) return
      const { data, error } = await supabase.from('products').select('*').eq('category_id', cat.id).order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase()) || (p.model || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const statusBadge: Record<string, string> = { ready: 'badge-success', sold: 'badge-info', reserved: 'badge-warning', repairing: 'badge-danger' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)' }}><div className="spinner" /></div>

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h1 className="text-h1" style={{ marginBottom: 4 }}>Unit Laptop</h1>
          <p className="text-small" style={{ color: 'var(--color-ink-3)' }}>Kelola stok unit laptop</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2xs)' }}>
          <Link href="/unit-laptop/beli" className="btn btn-secondary"><ArrowDownToLine size={16} /> Beli Unit</Link>
          <Link href="/unit-laptop/jual" className="btn btn-primary"><ShoppingCart size={16} /> Jual Unit</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2xs)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-3)' }} />
          <input type="text" placeholder="Cari merk, tipe, atau SKU..." value={search} onChange={e => setSearch(e.target.value)} className="input input-sm" style={{ paddingLeft: 36 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select select-sm" style={{ width: 160 }}>
          <option value="all">Semua Status</option><option value="ready">Ready</option><option value="sold">Terjual</option><option value="reserved">Reserved</option><option value="repairing">Repairing</option>
        </select>
      </div>

      <div className="table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Unit</th><th>Spesifikasi</th><th>Kondisi</th><th>Harga Beli</th><th>Harga Jual</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-ink-3)' }}>Belum ada unit laptop</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <p style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{p.brand} {p.model}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)' }}>{p.sku || '-'}</p>
                  </td>
                  <td style={{ color: 'var(--color-ink-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.specs || '-'}</td>
                  <td style={{ color: 'var(--color-ink-2)', textTransform: 'capitalize' }}>{p.condition || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{formatRupiah(p.buy_price)}</td>
                  <td style={{ fontWeight: 500 }}>{formatRupiah(p.sell_price)}</td>
                  <td><span className={`badge ${statusBadge[p.status] || 'badge-neutral'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
