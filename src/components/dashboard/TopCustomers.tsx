import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

interface TopCustomersProps {
  items: Array<{
    name: string
    total: number
    count: number
  }>
  limit?: number
}

export default function TopCustomers({ items, limit = 5 }: TopCustomersProps) {
  const displayItems = items.slice(0, limit)
  
  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold" style={{ fontWeight: 700 }}>
          Customer Terbaik
        </CardTitle>
        <p className="text-sm text-ash">Top {limit} customer berdasarkan total belanja</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <p className="text-sm text-stone text-center py-8">Belum ada data customer</p>
          ) : (
            displayItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-badge-success/10 flex-shrink-0">
                    <User size={18} className="text-badge-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{item.name}</p>
                    <p className="text-xs text-stone mt-0.5">{item.count} transaksi</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-ink font-mono">{formatRupiah(item.total)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
