import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'servis' | 'sale' | 'purchase'
  title: string
  subtitle: string
  amount: number
  date: string
  status?: string
}

interface RecentTransactionsProps {
  items: Transaction[]
  limit?: number
}

export default function RecentTransactions({ items, limit = 5 }: RecentTransactionsProps) {
  const displayItems = items.slice(0, limit)
  
  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      servis: 'Servis',
      sale: 'Penjualan',
      purchase: 'Pembelian'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      servis: 'info' as const,
      sale: 'success' as const,
      purchase: 'secondary' as const
    }
    return variants[type as keyof typeof variants] || 'secondary' as const
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold" style={{ fontWeight: 700 }}>
            Transaksi Terbaru
          </CardTitle>
          <p className="text-sm text-ash mt-1">
            {limit} transaksi terakhir di periode ini
          </p>
        </div>
        <Link href="/laporan" className="text-sm text-ink hover:underline flex items-center gap-1">
          Lihat semua
          <ArrowRight size={14} />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <p className="text-sm text-stone text-center py-8">Belum ada transaksi</p>
          ) : (
            displayItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-hairline hover:border-primary/20 hover:bg-secondary/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getTypeBadge(item.type)} className="text-[10px] px-1.5 py-0">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.status && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink truncate">{item.title}</p>
                  <p className="text-xs text-stone mt-0.5">{item.subtitle}</p>
                  <p className="text-[10px] text-stone mt-1">{formatDate(item.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-ink font-mono">
                    {formatRupiah(item.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
