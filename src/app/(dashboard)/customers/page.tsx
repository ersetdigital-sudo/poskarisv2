'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Customer } from '@/lib/supabase'
import { Search, Eye, Phone, MapPin, ArrowUpDown, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/dashboard/PageHeader'
import Link from 'next/link'

interface CustomerWithStats extends Customer {
  total_transaksi: number
  transaksi_terakhir: string | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nama' | 'transaksi_terakhir'>('nama')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch customers
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .order(sortBy === 'nama' ? 'nama' : 'created_at', { ascending: sortDir === 'asc' })

      if (error) throw error

      // Fetch stats for each customer
      const customersWithStats: CustomerWithStats[] = await Promise.all(
        (customersData || []).map(async (cust) => {
          // Count sales
          const { count: salesCount } = await supabase
            .from('sales')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', cust.id)

          // Count services
          const { count: serviceCount } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', cust.id)

          // Get last transaction date
          const { data: lastSale } = await supabase
            .from('sales')
            .select('date')
            .eq('customer_id', cust.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()

          const { data: lastService } = await supabase
            .from('services')
            .select('date_in')
            .eq('customer_id', cust.id)
            .order('date_in', { ascending: false })
            .limit(1)
            .maybeSingle()

          const lastDate = lastSale?.date || lastService?.date_in || null

          return {
            ...cust,
            total_transaksi: (salesCount || 0) + (serviceCount || 0),
            transaksi_terakhir: lastDate,
          }
        })
      )

      // Sort by transaksi_terakhir if needed
      if (sortBy === 'transaksi_terakhir') {
        customersWithStats.sort((a, b) => {
          const dateA = a.transaksi_terakhir ? new Date(a.transaksi_terakhir).getTime() : 0
          const dateB = b.transaksi_terakhir ? new Date(b.transaksi_terakhir).getTime() : 0
          return sortDir === 'asc' ? dateA - dateB : dateB - dateA
        })
      }

      setCustomers(customersWithStats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortDir])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter by search
  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return c.nama.toLowerCase().includes(q) || c.no_wa.includes(q)
  })

  const toggleSort = (field: 'nama' | 'transaksi_terakhir') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Customer" subtitle="Daftar customer yang pernah melakukan transaksi" />

      {/* Search & Filter */}
      <Card className="shadow-card">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama atau No. WA..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={sortBy === 'nama' ? 'default' : 'outline'}
                size="sm"
                className="h-9 gap-1 text-xs"
                onClick={() => toggleSort('nama')}
              >
                Nama
                <ArrowUpDown size={12} />
              </Button>
              <Button
                variant={sortBy === 'transaksi_terakhir' ? 'default' : 'outline'}
                size="sm"
                className="h-9 gap-1 text-xs"
                onClick={() => toggleSort('transaksi_terakhir')}
              >
                Transaksi Terakhir
                <ArrowUpDown size={12} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Mobile Card View */}
      {!loading && (
        <div className="block lg:hidden space-y-2">
          {filtered.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {search ? 'Customer tidak ditemukan' : 'Belum ada data customer'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`} className="no-underline">
                <Card className="shadow-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{c.nama}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone size={11} className="text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">{c.no_wa}</p>
                        </div>
                        {c.alamat && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin size={11} className="text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">{c.alamat}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">{c.total_transaksi} transaksi</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {c.transaksi_terakhir ? formatDate(c.transaksi_terakhir) : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!loading && (
        <div className="hidden lg:block">
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">No. WA</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alamat</th>
                      <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Transaksi</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Terakhir</th>
                      <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-xs text-muted-foreground">
                          {search ? 'Customer tidak ditemukan' : 'Belum ada data customer'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map(c => (
                        <tr key={c.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <p className="text-sm font-semibold text-foreground">{c.nama}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-xs font-mono text-foreground">{c.no_wa}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.alamat || '-'}</p>
                          </td>
                          <td className="p-3 text-center">
                            <p className="text-xs font-medium text-foreground">{c.total_transaksi}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-xs text-muted-foreground">{formatDate(c.transaksi_terakhir)}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <Link href={`/customers/${c.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <Eye size={13} />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
