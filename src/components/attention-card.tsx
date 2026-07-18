'use client'

import { AlertTriangle, Package, Clock, TrendingDown } from 'lucide-react'

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
    <div className="card" style={{ padding: 'var(--space-lg)', height: '100%', border: hasAlerts ? '1px solid oklch(72% 0.16 75 / 0.3)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={15} color={hasAlerts ? 'var(--color-warning)' : 'var(--color-ink-3)'} />
          <h3 className="text-h3">Perlu Perhatian</h3>
        </div>
        <span style={{ fontSize: 11, color: hasAlerts ? 'var(--color-warning)' : 'var(--color-ink-3)', fontWeight: 500 }}>
          {loading ? '...' : hasAlerts ? `${alerts.length} item` : 'Aman'}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : !hasAlerts ? (
        <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-success-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-xs)',
          }}>
            <TrendingDown size={18} color="var(--color-success)" />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>Semua aman, tidak ada yang perlu perhatian khusus.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)' }}>
          {alerts.map((alert) => {
            const config = alertConfig(alert.type)
            const Icon = config.icon
            return (
              <div key={alert.id} style={{
                display: 'flex', gap: 'var(--space-xs)', padding: 'var(--space-xs)',
                borderRadius: 'var(--radius-md)', background: config.bg,
                border: `1px solid ${config.border}`,
              }}>
                <div style={{ flexShrink: 0, paddingTop: 1 }}>
                  <Icon size={16} color={config.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: config.color, marginBottom: 2 }}>
                    {alert.title}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                    {alert.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function alertConfig(type: AlertItem['type']) {
  switch (type) {
    case 'low_stock':
      return { icon: Package, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'oklch(72% 0.16 75 / 0.15)' }
    case 'overdue_service':
      return { icon: Clock, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', border: 'oklch(58% 0.22 25 / 0.15)' }
    case 'slow_unit':
      return { icon: TrendingDown, color: 'var(--color-ink-3)', bg: 'var(--color-paper-3)', border: 'var(--color-rule)' }
    default:
      return { icon: AlertTriangle, color: 'var(--color-ink-3)', bg: 'var(--color-paper-3)', border: 'var(--color-rule)' }
  }
}
