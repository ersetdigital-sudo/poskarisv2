import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopProductsProps {
  items: Array<{
    name: string
    qty: number
    revenue: number
    category?: string
  }>
  limit?: number
}

export default function TopProducts({ items, limit = 5 }: TopProductsProps) {
  const displayItems = items.slice(0, limit)
  
  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold" style={{ fontWeight: 700 }}>
          Produk Terlaris
        </CardTitle>
        <p className="text-sm text-ash">Top {limit} produk berdasarkan quantity</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <p className="text-sm text-stone text-center py-8">Belum ada data produk</p>
          ) : (
            displayItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-xs font-bold text-ink">{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone">{item.qty} terjual</span>
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-ink font-mono">{formatRupiah(item.revenue)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
