'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>
  loading?: boolean
  trendPct?: number
  trendDirection?: 'up' | 'down' | 'flat'
  trendLabel?: string
  sparkData?: { value: number }[]
  accent?: 'primary' | 'success' | 'warning' | 'neutral'
}

const accentColors = {
  primary: { stroke: 'var(--primary)', fill: 'var(--primary)' },
  success: { stroke: '#10b981', fill: '#10b981' },
  warning: { stroke: '#f59e0b', fill: '#f59e0b' },
  neutral: { stroke: 'var(--muted-foreground)', fill: 'var(--muted-foreground)' },
}

export function StatCard({
  label, value, icon: Icon, loading,
  trendPct, trendDirection, trendLabel,
  sparkData, accent = 'neutral',
}: StatCardProps) {
  const colors = accentColors[accent]
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus
  const trendClass = trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-destructive' : 'text-muted-foreground'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon size={15} className="text-muted-foreground" />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {loading ? <div className="h-7 w-12 animate-pulse rounded bg-muted" /> : value}
          </div>
          {sparkData && sparkData.length > 0 && !loading && (
            <div className="h-8 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.fill} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke={colors.stroke} strokeWidth={1.5}
                    fill={`url(#spark-${accent})`} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {trendLabel && !loading && (
          <div className="mt-2 flex items-center gap-1">
            <TrendIcon size={12} className={trendClass} />
            <span className={`text-xs font-medium ${trendClass}`}>
              {trendPct !== undefined && trendPct > 0 ? `${trendPct}%` : ''}
            </span>
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
