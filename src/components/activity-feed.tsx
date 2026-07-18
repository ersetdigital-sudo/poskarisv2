'use client'

import { Wrench, ShoppingCart, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface Activity {
  id: string
  type: 'servis' | 'sale' | 'stock_in' | 'stock_out' | 'alert'
  title: string
  description: string
  timestamp: string
}

const iconMap = {
  servis: { icon: Wrench, color: 'text-primary' },
  sale: { icon: ShoppingCart, color: 'text-emerald-600' },
  stock_in: { icon: Package, color: 'text-emerald-600' },
  stock_out: { icon: Package, color: 'text-destructive' },
  alert: { icon: AlertTriangle, color: 'text-amber-500' },
  complete: { icon: CheckCircle, color: 'text-emerald-600' },
}

export function ActivityFeed({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle>
          <span className="text-xs text-muted-foreground">{activities.length} aktivitas</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2.5">
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-muted" />
                <div className="flex-1">
                  <div className="mb-1 h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
            </div>
          ) : (
            activities.slice(0, 6).map((act, i) => {
              const config = iconMap[act.type] || iconMap.servis
              const Icon = config.icon
              return (
                <div key={act.id} className="relative flex gap-3 py-2.5">
                  {i < Math.min(activities.length, 6) - 1 && (
                    <div className="absolute left-[13px] top-[38px] -bottom-2.5 w-px bg-border" />
                  )}
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon size={14} className={config.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {act.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                      {act.description}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(act.timestamp)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
