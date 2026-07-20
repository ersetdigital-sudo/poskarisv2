'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Customer, Sale, Service } from '@/lib/supabase'
import { ArrowLeft, Phone, MapPin, Wrench, ShoppingCart, Download, Plus, Loader2, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotaUnitPDF } from '@/components/pdf/nota-unit'
import { NotaServisPDF } from '@/components/pdf/nota-servis'
import { downloadPDF } from '@/components/pdf/utils'
import Link from 'next/link'

type TabType = 'service' | 'penjualan'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<(Sale & { products?: { brand: string; model: string; specs: string | null } })[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('service')
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [storeInfo, setStoreInfo] = useState({ storeName: 'Kasir POS', storeAddress: '', storePhone: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch customer
      const { data: cust, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (custError) throw custError
      setCustomer(cust)

      // Fetch sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, products(brand, model, specs)')
        .eq('customer_id', customerId)
        .order('date', { ascending: false })

      setSales(salesData || [])

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('customer_id', customerId)
        .order('date_in', { ascending: false })

      setServices(servicesData || [])

      // Fetch store settings
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['store_name', 'store_address', 'store_phone'])

      const map: Record<string, string> = {}
      settings?.forEach(row => { map[row.key] = row.value })
      setStoreInfo({
        storeName: map.store_name || 'Kasir POS',
        storeAddress: map.store_address || '',
        storePhone: map.store_phone || '',
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai':
      case 'completed': return 'success'
      case 'proses':
      case 'menunggu': return 'warning'
      case 'dibatalkan':
      case 'cancelled': return 'destructive'
      case 'returned': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai'
      case 'proses': return 'Proses'
      case 'menunggu': return 'Menunggu'
      case 'dibatalkan': return 'Dibatalkan'
      case 'completed': return 'Selesai'
      case 'returned': return 'Dikembalikan'
      case 'cancelled': return 'Dibatalkan'
      default: return status
    }
  }

  const handleDownloadSalePDF = async (sale: Sale & { products?: { brand: string; model: string; specs: string | null } }) => {
    if (!sale.products) return
    setPdfLoading(sale.id)
    try {
      const doc = NotaUnitPDF({
        sale: { ...sale, warranty_end_date: sale.warranty_end_date || null },
        product: sale.products as any,
        ...storeInfo,
      })
      await downloadPDF(doc, `Invoice-${sale.invoice_number}.pdf`)
    } catch (e) {
      console.error('Gagal generate PDF:', e)
    } finally {
      setPdfLoading(null)
    }
  }

  const handleDownloadServicePDF = async (service: Service) => {
    setPdfLoading(service.id)
    try {
      const { data: parts } = await supabase
        .from('service_parts')
        .select('quantity, price, products(name)')
        .eq('service_id', service.id)

      const partsList = parts?.map(p => ({
        name: (p.products as any)?.name || 'Part',
        quantity: p.quantity,
        price: p.price,
      })) || []

      const doc = NotaServisPDF({
        service,
        parts: partsList,
        ...storeInfo,
      })
      await downloadPDF(doc, `Nota-${service.nota_number}.pdf`)
    } catch (e) {
      console.error('Gagal generate PDF:', e)
    } finally {
      setPdfLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button onClick={() => router.push('/customers')} variant="secondary" className="gap-2">
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Customer tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.push('/customers')} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Detail Customer</h1>
          <p className="text-xs text-muted-foreground">Informasi dan riwayat transaksi customer</p>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{customer.nama}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} />
                <span className="font-mono">{customer.no_wa}</span>
              </div>
              {customer.alamat && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>{customer.alamat}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/servis?customer_id=${customer.id}&nama=${encodeURIComponent(customer.nama)}&phone=${encodeURIComponent(customer.no_wa)}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus size={14} />
                  <Wrench size={14} />
                  Nota Service
                </Button>
              </Link>
              <Link href={`/unit-laptop/jual?customer_id=${customer.id}&nama=${encodeURIComponent(customer.nama)}&phone=${encodeURIComponent(customer.no_wa)}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus size={14} />
                  <ShoppingCart size={14} />
                  Nota Penjualan
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{services.length}</p>
              <p className="text-xs text-muted-foreground">Service</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{sales.length}</p>
              <p className="text-xs text-muted-foreground">Penjualan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {formatRupiah(services.reduce((sum, s) => sum + s.total_fee, 0) + sales.reduce((sum, s) => sum + s.sell_price, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total Nilai</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {formatDate(services[0]?.date_in || sales[0]?.date || null)}
              </p>
              <p className="text-xs text-muted-foreground">Transaksi Terakhir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Toggle */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <button
          onClick={() => setTab('service')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            tab === 'service' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench size={16} />
          Riwayat Service ({services.length})
        </button>
        <button
          onClick={() => setTab('penjualan')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            tab === 'penjualan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingCart size={16} />
          Riwayat Penjualan ({sales.length})
        </button>
      </div>

      {/* Service History */}
      {tab === 'service' && (
        <div className="space-y-2">
          {services.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Belum ada riwayat service</p>
              </CardContent>
            </Card>
          ) : (
            services.map(s => (
              <Card key={s.id} className="shadow-card hover:bg-muted/50 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-mono font-semibold text-foreground">{s.nota_number}</p>
                        <Badge variant={getStatusColor(s.status) as any} className="text-[10px] px-1.5 py-0.5">
                          {getStatusLabel(s.status)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {s.device_type} {s.device_brand} {s.device_model}
                      </p>
                      {s.complaint && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{s.complaint}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(s.date_in)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          {formatRupiah(s.total_fee)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadServicePDF(s)}
                        disabled={pdfLoading === s.id}
                      >
                        {pdfLoading === s.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </Button>
                      <Link href={`/servis/${s.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Sales History */}
      {tab === 'penjualan' && (
        <div className="space-y-2">
          {sales.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Belum ada riwayat penjualan</p>
              </CardContent>
            </Card>
          ) : (
            sales.map(s => (
              <Card key={s.id} className="shadow-card hover:bg-muted/50 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-mono font-semibold text-foreground">{s.invoice_number}</p>
                        <Badge variant={getStatusColor(s.status) as any} className="text-[10px] px-1.5 py-0.5">
                          {getStatusLabel(s.status)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {s.item_type === 'unit' ? 'Unit' : 'Sparepart'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {s.products ? `${s.products.brand} ${s.products.model}` : s.item_name || '-'}
                      </p>
                      {s.products?.specs && (
                        <p className="text-xs text-muted-foreground mt-0.5">{s.products.specs}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(s.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          {formatRupiah(s.sell_price)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadSalePDF(s)}
                        disabled={pdfLoading === s.id}
                      >
                        {pdfLoading === s.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
