'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; color?: string }>
  loading?: boolean
  trendPct?: number
  trendDirection?: 'up' | 'down' | 'flat'
  trendLabel?: string
  sparkData?: { value: number }[]
  accent?: 'primary' | 'success' | 'warning' | 'neutral'
}

const accentVars = {
  primary: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  neutral: 'var(--color-ink-3)',
}

export function StatCard({
  label, value, icon: Icon, loading,
  trendPct, trendDirection, trendLabel,
  sparkData, accent = 'neutral',
}: StatCardProps) {
  const color = accentVars[accent]

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus
  const trendColor = trendDirection === 'up' ? 'var(--color-success)' : trendDirection === 'down' ? 'var(--color-danger)' : 'var(--color-ink-3)'

  return (
    <div className="card card-hover" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2xs)' }}>
        <span className="text-caption">{label}</span>
        <Icon size={15} color="var(--color-ink-3)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-2xs)' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600,
          color: 'var(--color-ink)', letterSpacing: 'var(--tracking-display)', lineHeight: 1,
        }}>
          {loading ? <div className="skeleton" style={{ width: 50, height: 26 }} /> : value}
        </div>

        {sparkData && sparkData.length > 0 && !loading && (
          <div style={{ width: 70, height: 32 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${accent})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {trendLabel && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'var(--space-2xs)' }}>
          <TrendIcon size={12} color={trendColor} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: trendColor }}>
            {trendPct !== undefined && trendPct > 0 ? `${trendPct}%` : ''}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
