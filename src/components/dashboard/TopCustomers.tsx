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
    <Card className="shadow-card hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold" style={{ fontWeight: 700 }}>
          Customer Terbaik
        </CardTitle>
        <p className="text-xs text-ash">Top {limit} customer berdasarkan total belanja</p>
      </CardHeader>
      <CardContent className="pt-0">
        {displayItems.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-stone">Belum ada data customer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-badge-success/10 flex-shrink-0">
                    <User size={16} className="text-badge-success" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] text-stone mt-0.5">{item.count} transaksi</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-ink font-mono">{formatRupiah(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
