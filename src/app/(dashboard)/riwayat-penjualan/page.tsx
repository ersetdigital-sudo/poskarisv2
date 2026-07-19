'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Sale, Product } from '@/lib/supabase'
import { Search, Eye, Download, ShoppingCart, Laptop, Package, DollarSign, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { NotaUnitPDF } from '@/components/pdf/nota-unit'
import { NotaSparepartPDF } from '@/components/pdf/nota-sparepart'
import { downloadPDF } from '@/components/pdf/utils'
import PageHeader from '@/components/dashboard/PageHeader'
import StatCard from '@/components/dashboard/StatCard'

export default function RiwayatPenjualanPage() {
  const [sales, setSales] = useState<(Sale & { products?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [detailSale, setDetailSale] = useState<(Sale & { products?: Product }) | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<(Sale & { products?: Product }) | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })
  const itemsPerPage = 10

  const fetchSales = useCallback(async () => {
    try {
      const [year, month] = filterMonth.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('sales')
        .select('*, products(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSales(data || [])
      setCurrentPage(1)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [filterMonth])

  useEffect(() => {
    fetchSales()
    fetchStoreSettings()
  }, [fetchSales])

  async function fetchStoreSettings() {
    try {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['store_name', 'store_address', 'store_phone'])
      const map: Record<string, string> = {}
      data?.forEach(row => { map[row.key] = row.value })
      setStoreInfo({ storeName: map.store_name || 'Kasir POS', storeAddress: map.store_address || '', storePhone: map.store_phone || '' })
    } catch (e) { console.error(e) }
  }

  async function handleDelete(sale: Sale & { products?: Product }) {
    setDeleting(true)
    try {
      // Hapus stock_movements terkait
      await supabase.from('stock_movements').delete().eq('reference_id', sale.id).eq('reference_type', 'penjualan_unit')
      
      // Hapus sale
      const { error } = await supabase.from('sales').delete().eq('id', sale.id)
      if (error) throw error

      // Jika unit, kembalikan status produk ke ready
      if (sale.item_type === 'unit' && sale.product_id) {
        await supabase.from('products').update({ status: 'ready' }).eq('id', sale.product_id)
      }
      // Jika sparepart, tambah kembali stok
      if (sale.item_type === 'sparepart' && sale.product_id) {
        const { data: product } = await supabase.from('products').select('quantity').eq('id', sale.product_id).single()
        if (product) {
          await supabase.from('products').update({ quantity: product.quantity + sale.quantity }).eq('id', sale.product_id)
        }
      }

      setDeleteConfirm(null)
      fetchSales()
    } catch (e) {
      console.error(e)
      alert('Gagal menghapus transaksi: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  // Filter
  const filtered = sales.filter(s => {
    const matchSearch = s.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
      s.invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || s.item_type === filterType
    return matchSearch && matchType
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Summary stats
  const totalPenjualan = filtered.reduce((sum, s) => sum + s.sell_price, 0)
  const totalTransaksi = filtered.length
  const unitSales = filtered.filter(s => s.item_type === 'unit')
  const sparepartSales = filtered.filter(s => s.item_type === 'sparepart')
  const totalUnit = unitSales.length
  const totalUnitRp = unitSales.reduce((sum, s) => sum + s.sell_price, 0)
  const totalSparepart = sparepartSales.reduce((sum, s) => sum + s.quantity, 0)
  const totalSparepartRp = sparepartSales.reduce((sum, s) => sum + s.sell_price, 0)

  async function handleDownloadPDF(sale: Sale & { products?: Product }) {
    setPdfLoading(sale.id)
    try {
      let doc
      if (sale.item_type === 'unit' && sale.products) {
        doc = NotaUnitPDF({
          sale: { ...sale, warranty_end_date: sale.warranty_end_date || null },
          product: sale.products, ...storeInfo,
        })
      } else if (sale.item_type === 'sparepart' && sale.products) {
        doc = NotaSparepartPDF({
          sale: { ...sale },
          product: sale.products, ...storeInfo,
        })
      }
      if (doc) await downloadPDF(doc, `Invoice-${sale.invoice_number}.pdf`)
    } catch (e) { console.error('Gagal generate PDF:', e) }
    finally { setPdfLoading(null) }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><div className="spinner" /></div>

  return (
    <div className="space-y-3">
      <PageHeader title="Riwayat Penjualan" subtitle="Semua transaksi penjualan unit laptop dan sparepart" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Penjualan"
          value={formatRupiah(totalPenjualan)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Total Transaksi"
          value={String(totalTransaksi)}
          icon={ShoppingCart}
          color="sky"
        />
        <StatCard
          title="Unit Laptop"
          value={`${totalUnit} unit`}
          sub={formatRupiah(totalUnitRp)}
          icon={Laptop}
          color="emerald"
        />
        <StatCard
          title="Sparepart"
          value={`${totalSparepart} item`}
          sub={formatRupiah(totalSparepartRp)}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <Input type="text" placeholder="Cari nota, barang, atau pembeli..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex gap-2">
              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm flex-1 sm:w-[160px]" />
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1) }} className="h-9 rounded-lg border border-hairline-strong bg-surface px-3 text-sm flex-1 sm:w-[160px]">
                <option value="all">Semua Tipe</option>
                <option value="unit">Unit Laptop</option>
                <option value="sparepart">Sparepart</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-2">
        {paginatedData.length === 0 ? (
          <Card className="shadow-card"><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Belum ada transaksi</p></CardContent></Card>
        ) : paginatedData.map(s => (
          <Card key={s.id} className="shadow-card overflow-hidden cursor-pointer" onClick={() => setDetailSale(s)}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-hairline">
                <p className="text-[11px] font-mono font-semibold text-ink">{s.invoice_number}</p>
                <Badge variant={s.item_type === 'unit' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                  {s.item_type === 'unit' ? 'Unit' : 'Sparepart'}
                </Badge>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{s.item_name || '-'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.buyer_name}</p>
                  </div>
                  <p className="text-sm font-bold font-mono text-ink shrink-0">{formatRupiah(s.sell_price)}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-stone">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground">{s.payment_method}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(s) }}
                      className="h-6 w-6 flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
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
                  <tr className="border-b border-hairline">
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">No. Nota</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Tanggal</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Tipe</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Nama Barang</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Pembeli</th>
                    <th className="text-right p-3 text-xs font-medium text-ash uppercase tracking-wide">Harga</th>
                    <th className="text-left p-3 text-xs font-medium text-ash uppercase tracking-wide">Bayar</th>
                    <th className="text-center p-3 text-xs font-medium text-ash uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={8} className="text-center p-8 text-xs text-stone">Belum ada transaksi</td></tr>
                  ) : paginatedData.map(s => (
                    <tr key={s.id} className="border-b border-hairline hover:bg-secondary/30 transition-colors">
                      <td className="p-3"><p className="text-xs font-mono font-semibold text-ink">{s.invoice_number}</p></td>
                      <td className="p-3"><p className="text-xs text-stone">{new Date(s.date).toLocaleDateString('id-ID')}</p></td>
                      <td className="p-3"><Badge variant={s.item_type === 'unit' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">{s.item_type === 'unit' ? 'Unit' : 'Sparepart'}</Badge></td>
                      <td className="p-3"><p className="text-xs font-semibold text-ink">{s.item_name || '-'}</p></td>
                      <td className="p-3"><p className="text-xs text-ink">{s.buyer_name}</p></td>
                      <td className="p-3 text-right"><p className="text-xs font-bold text-ink font-mono">{formatRupiah(s.sell_price)}</p></td>
                      <td className="p-3"><p className="text-xs text-muted-foreground">{s.payment_method}</p></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetailSale(s)}>
                            <Eye size={13} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownloadPDF(s)} disabled={pdfLoading === s.id}>
                            {pdfLoading === s.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" /> : <Download size={13} />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(s)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="shadow-card">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&laquo;</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
                  return <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                })}
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>&raquo;</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {detailSale && (
        <Modal title={`Detail Transaksi ${detailSale.invoice_number}`} onClose={() => setDetailSale(null)} maxWidth="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">No. Invoice</p><p className="font-semibold text-foreground font-mono">{detailSale.invoice_number}</p></div>
              <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tanggal</p><p className="font-semibold text-foreground">{new Date(detailSale.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tipe</p><Badge variant={detailSale.item_type === 'unit' ? 'default' : 'secondary'} className="text-[10px]">{detailSale.item_type === 'unit' ? 'Unit Laptop' : 'Sparepart'}</Badge></div>
              <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Metode Bayar</p><p className="font-semibold text-foreground">{detailSale.payment_method}</p></div>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="text-xs font-bold text-foreground mb-2">Detail Barang</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-[10px] text-muted-foreground">Nama</p><p className="font-medium text-foreground">{detailSale.item_name || '-'}</p></div>
                {detailSale.item_type === 'sparepart' && <div><p className="text-[10px] text-muted-foreground">Qty</p><p className="font-medium text-foreground">{detailSale.quantity}</p></div>}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="text-xs font-bold text-foreground mb-2">Data Pembeli</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-[10px] text-muted-foreground">Nama</p><p className="font-medium text-foreground">{detailSale.buyer_name}</p></div>
                <div><p className="text-[10px] text-muted-foreground">No. HP</p><p className="font-medium text-foreground">{detailSale.buyer_phone || '-'}</p></div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Harga Jual</span>
                <span className="font-mono text-lg font-bold text-foreground">{formatRupiah(detailSale.sell_price)}</span>
              </div>
              {detailSale.item_type === 'unit' && detailSale.garansi && detailSale.garansi.toLowerCase() !== 'tanpa garansi' && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Garansi</span>
                  <span className="text-sm font-medium text-foreground">{detailSale.garansi}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleDownloadPDF(detailSale)} disabled={pdfLoading === detailSale.id} variant="outline" className="flex-1 gap-2">
                {pdfLoading === detailSale.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" /> : <Download size={14} />}
                Download PDF
              </Button>
              <Button onClick={() => setDetailSale(null)} variant="secondary" className="flex-1">Tutup</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title="Hapus Transaksi" onClose={() => setDeleteConfirm(null)} maxWidth="sm">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Yakin ingin menghapus transaksi <span className="font-semibold text-foreground">{deleteConfirm.invoice_number}</span>?
            </p>
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                {deleteConfirm.item_type === 'unit' 
                  ? 'Status produk akan dikembalikan ke "Ready".' 
                  : `Stok ${deleteConfirm.item_name} akan ditambah kembali sebanyak ${deleteConfirm.quantity}.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 h-10" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="destructive" className="flex-1 h-10" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
