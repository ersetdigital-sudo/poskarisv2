'use client'

import { AlertTriangle, Package, Clock, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AlertItem {
  id: string
  type: 'low_stock' | 'overdue_service' | 'slow_unit'
  title: string
  description: string
  action?: { label: string; href: string }
}

export function AttentionCard({ alerts, loading }: { alerts: AlertItem[]; loading: boolean }) {
  const hasAlerts = alerts.length > 0

  return (
    <Card className={`h-full ${hasAlerts ? 'border-amber-300/50 dark:border-amber-600/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className={hasAlerts ? 'text-amber-500' : 'text-muted-foreground'} />
            <CardTitle className="text-sm font-medium">Perlu Perhatian</CardTitle>
          </div>
          <span className={`text-xs font-medium ${hasAlerts ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {loading ? '...' : hasAlerts ? `${alerts.length} item` : 'Aman'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : !hasAlerts ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <TrendingDown size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">Semua aman, tidak ada yang perlu perhatian khusus.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = alertConfig(alert.type)
              return (
                <div key={alert.id} className={`flex gap-3 rounded-lg p-3 ${config.className}`}>
                  <config.icon size={16} className={`mt-0.5 shrink-0 ${config.iconClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${config.iconClass}`}>{alert.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/70">{alert.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function alertConfig(type: AlertItem['type']) {
  switch (type) {
    case 'low_stock':
      return { icon: Package, className: 'bg-amber-50 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30', iconClass: 'text-amber-600 dark:text-amber-400' }
    case 'overdue_service':
      return { icon: Clock, className: 'bg-red-50 border border-red-200/50 dark:bg-red-950/20 dark:border-red-800/30', iconClass: 'text-red-600 dark:text-red-400' }
    case 'slow_unit':
      return { icon: TrendingDown, className: 'bg-muted border border-border', iconClass: 'text-muted-foreground' }
    default:
      return { icon: AlertTriangle, className: 'bg-muted border border-border', iconClass: 'text-muted-foreground' }
  }
}
