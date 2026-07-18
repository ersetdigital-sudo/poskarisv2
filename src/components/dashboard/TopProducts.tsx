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
    <Card className="shadow-card hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold" style={{ fontWeight: 700 }}>
          Produk Terlaris
        </CardTitle>
        <p className="text-xs text-ash">Top {limit} produk berdasarkan quantity</p>
      </CardHeader>
      <CardContent className="pt-0">
        {displayItems.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-stone">Belum ada data produk</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-[11px] font-bold text-ink">{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone">{item.qty} terjual</span>
                      {item.category && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-ink font-mono">{formatRupiah(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
