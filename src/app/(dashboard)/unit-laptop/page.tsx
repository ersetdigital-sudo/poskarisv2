'use client'

import { useEffect, useState } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { Search, ShoppingCart, ArrowDownToLine } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/dashboard/PageHeader'

export default function UnitLaptopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Unit Laptop').maybeSingle()
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })
      if (cat) query = query.eq('category_id', cat.id)
      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.brand || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.model || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  
  const statusVariant = (status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    const map: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      ready: 'success',
      sold: 'secondary',
      reserved: 'warning',
      repairing: 'destructive',
    }
    return map[status] || 'secondary'
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Unit Laptop"
        subtitle="Kelola stok unit laptop untuk dijual"
      >
        <div className="flex gap-2">
          <Link href="/unit-laptop/beli">
            <Button variant="secondary" className="gap-2">
              <ArrowDownToLine size={16} strokeWidth={2} />
              Beli Unit
            </Button>
          </Link>
          <Link href="/unit-laptop/jual">
            <Button className="gap-2">
              <ShoppingCart size={16} strokeWidth={2} />
              Jual Barang
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <Input 
                type="text" 
                placeholder="Cari merk, tipe, atau SKU..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm sm:w-[160px]"
            >
              <option value="all">Semua Status</option>
              <option value="ready">Ready</option>
              <option value="sold">Terjual</option>
              <option value="reserved">Reserved</option>
              <option value="repairing">Repairing</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-2">
        {filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Belum ada unit laptop</p>
            </CardContent>
          </Card>
        ) : filtered.map(p => (
          <Card key={p.id} className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="px-3 py-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{p.brand} {p.model}</p>
                    <p className="text-[10px] text-stone font-mono">{p.sku || '-'}</p>
                  </div>
                  <Badge variant={statusVariant(p.status)} className="text-[10px] px-1.5 py-0.5 capitalize shrink-0">
                    {p.status}
                  </Badge>
                </div>
                
                {p.specs && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.specs}</p>
                )}
                
                <div className="flex items-center justify-between pt-1 border-t border-hairline">
                  <div className="flex gap-3 text-xs">
                    <span className="text-muted-foreground">Beli: <span className="font-mono font-medium text-ink">{formatRupiah(p.buy_price)}</span></span>
                    <span className="text-muted-foreground">Jual: <span className="font-mono font-medium text-ink">{formatRupiah(p.sell_price)}</span></span>
                  </div>
                  {p.condition && (
                    <span className="text-[10px] text-muted-foreground capitalize">{p.condition}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30">
                    <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Unit</th>
                    <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Spesifikasi</th>
                    <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Kondisi</th>
                    <th className="text-right p-4 text-xs font-medium text-ash uppercase tracking-wide">Harga Beli</th>
                    <th className="text-right p-4 text-xs font-medium text-ash uppercase tracking-wide">Harga Jual</th>
                    <th className="text-left p-4 text-xs font-medium text-ash uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-xs text-stone">
                        Belum ada unit laptop
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-hairline hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-ink">{p.brand} {p.model}</p>
                        <p className="text-[10px] text-stone font-mono mt-0.5">{p.sku || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-charcoal max-w-[300px] truncate">{p.specs || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-charcoal capitalize">{p.condition || '-'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-xs font-semibold text-ink font-mono">{formatRupiah(p.buy_price)}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-xs font-bold text-ink font-mono">{formatRupiah(p.sell_price)}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusVariant(p.status)} className="text-[10px] px-2 py-0.5 capitalize">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
