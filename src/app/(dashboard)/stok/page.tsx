'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, StockMovement } from '@/lib/supabase'
import { Search, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react'

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showMovements, setShowMovements] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [prodRes, movRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100),
      ])
      setProducts(prodRes.data || [])
      setMovements(movRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.48px', marginBottom:4 }}>Stok Barang</h1>
        <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)' }}>Kelola stok unit laptop dan sparepart</p>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom:16 }}>
          <AlertTriangle size={16} />
          <div>
            <p style={{ fontWeight:500, marginBottom:4 }}>Stok Menipis</p>
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
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--stone)' }} />
          <input type="text" placeholder="Cari nama barang atau SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="input input-sm" style={{ paddingLeft:36 }} />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select select-sm" style={{ width:180 }}>
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'var(--mute)' }}>Belum ada data stok</td></tr>
              ) : (
                filtered.map((p) => {
                  const catName = (p as Product & { categories?: { name: string } }).categories?.name || '-'
                  const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0
                  const statusClass = p.status === 'ready' ? 'badge-success' : p.status === 'sold' ? 'badge-primary' : 'badge-info'
                  return (
                    <tr key={p.id} style={{ cursor:'pointer', background: isLow ? 'var(--warning-bg)' : undefined }} onClick={() => { setSelectedProduct(p); setShowMovements(true) }}>
                      <td>
                        <div>
                          <p style={{ fontWeight:400, color:'var(--ink)' }}>{p.name}</p>
                          <p style={{ fontSize:12, color:'var(--mute)' }}>{p.sku || '-'}</p>
                        </div>
                      </td>
                      <td style={{ color:'var(--charcoal)' }}>{catName}</td>
                      <td>
                        <span style={{ fontWeight:500, color: isLow ? 'var(--warning-text)' : 'var(--ink)' }}>
                          {p.quantity}
                        </span>
                        {isLow && <AlertTriangle size={12} style={{ marginLeft:4, color:'var(--warning)' }} />}
                      </td>
                      <td style={{ color:'var(--charcoal)' }}>{formatRupiah(p.buy_price)}</td>
                      <td style={{ color:'var(--charcoal)' }}>{formatRupiah(p.sell_price)}</td>
                      <td><span className={`badge ${statusClass}`}>{p.status}</span></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      {showMovements && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowMovements(false)}>
          <div className="modal" style={{ maxWidth:480, padding:24 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:20, fontWeight:300, color:'var(--ink)', letterSpacing:'-0.4px', marginBottom:8 }}>
              Mutasi Stok: {selectedProduct.name}
            </h2>
            <p style={{ fontSize:14, fontWeight:300, color:'var(--mute)', marginBottom:20 }}>
              Stok saat ini: <span style={{ fontWeight:600, color:'var(--ink)' }}>{selectedProduct.quantity}</span>
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {movements.filter(m => m.product_id === selectedProduct.id).map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:4, border:'1px solid var(--hairline)' }}>
                  {m.type === 'masuk' ? <ArrowDown size={16} style={{ color:'var(--success-text)' }} /> : <ArrowUp size={16} style={{ color:'var(--danger-text)' }} />}
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{m.type === 'masuk' ? '+' : '-'}{m.quantity}</p>
                    <p style={{ fontSize:12, color:'var(--mute)' }}>{m.notes || m.reference_type}</p>
                  </div>
                  <span style={{ fontSize:12, color:'var(--stone)' }}>{new Date(m.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
              {movements.filter(m => m.product_id === selectedProduct.id).length === 0 && (
                <p style={{ padding:16, textAlign:'center', fontSize:14, color:'var(--mute)' }}>Belum ada mutasi stok</p>
              )}
            </div>
            <button onClick={() => setShowMovements(false)} className="btn-ghost" style={{ width:'100%', marginTop:16 }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
