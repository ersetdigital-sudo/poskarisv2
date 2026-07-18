'use client'

import { Wrench, ShoppingCart, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { timeAgo } from '@/lib/format'

export interface Activity {
  id: string
  type: 'servis' | 'sale' | 'stock_in' | 'stock_out' | 'alert'
  title: string
  description: string
  timestamp: string
}

const iconMap = {
  servis: { icon: Wrench, color: 'var(--color-accent)' },
  sale: { icon: ShoppingCart, color: 'var(--color-success)' },
  stock_in: { icon: Package, color: 'var(--color-success)' },
  stock_out: { icon: Package, color: 'var(--color-danger)' },
  alert: { icon: AlertTriangle, color: 'var(--color-warning)' },
  complete: { icon: CheckCircle, color: 'var(--color-success)' },
}

export function ActivityFeed({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <h3 className="text-h3">Aktivitas Terbaru</h3>
        <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{activities.length} aktivitas</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-xs)', padding: 'var(--space-xs) 0' }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 4 }} />
                <div className="skeleton" style={{ width: '40%', height: 11 }} />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Belum ada aktivitas</p>
          </div>
        ) : (
          activities.slice(0, 5).map((act, i) => {
            const config = iconMap[act.type] || iconMap.servis
            const Icon = config.icon
            return (
              <div key={act.id} style={{ display: 'flex', gap: 'var(--space-xs)', padding: 'var(--space-xs) 0', position: 'relative' }}>
                {i < Math.min(activities.length, 5) - 1 && (
                  <div style={{
                    position: 'absolute', left: 14, top: 38, bottom: -10,
                    width: 1, background: 'var(--color-rule)',
                  }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-paper-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1,
                }}>
                  <Icon size={14} color={config.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 1, lineHeight: 1.3 }}>
                    {act.title}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 2, lineHeight: 1.3 }}>
                    {act.description}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{timeAgo(act.timestamp)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
