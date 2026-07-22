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
  isAdmin?: boolean
}

export default function RecentTransactions({ items, limit = 5, isAdmin = true }: RecentTransactionsProps) {
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
    <Card className="shadow-card hover:shadow-card-hover">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold" style={{ fontWeight: 700 }}>
            Transaksi Terbaru
          </CardTitle>
          <p className="text-xs text-ash mt-0.5">
            {limit} transaksi terakhir di periode ini
          </p>
        </div>
        <Link href="/laporan" className="text-xs text-ink hover:underline flex items-center gap-1 flex-shrink-0">
          Lihat semua
          <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {displayItems.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-stone">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-hairline hover:border-primary/20 hover:bg-secondary/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant={getTypeBadge(item.type)} className="text-[9px] px-1.5 py-0 h-4">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.status && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        {item.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink truncate leading-tight">{item.title}</p>
                  <p className="text-[10px] text-stone mt-0.5 leading-tight">{item.subtitle}</p>
                  <p className="text-[9px] text-stone mt-0.5">{formatDate(item.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {isAdmin ? (
                    <p className="text-xs font-bold text-ink font-mono">
                      {formatRupiah(item.amount)}
                    </p>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                      {item.status || 'Selesai'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
