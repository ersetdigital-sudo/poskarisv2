'use client'

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface DailyChartProps {
  data: Array<{ date: string; omzet: number; profit: number }>
  title: string
  subtitle?: string
}

const formatRupiahShort = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
  return `${v}`
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

export default function DailyChart({ data, title, subtitle }: DailyChartProps) {
  return (
    <Card className="shadow-card transition-shadow hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-ash">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradOmzet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#000000" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#efefef" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fill: '#4b4b4b', fontSize: 11 }}
              axisLine={{ stroke: '#efefef' }}
            />
            <YAxis
              tickFormatter={formatRupiahShort}
              tick={{ fill: '#4b4b4b', fontSize: 11 }}
              axisLine={{ stroke: '#efefef' }}
            />
            <Tooltip
              formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
              labelFormatter={(label) =>
                new Date(`${label}T00:00:00`).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              }
              contentStyle={{
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
                fontSize: '11px',
              }}
              labelStyle={{ color: '#000000', fontWeight: 700 }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
            <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#000000" strokeWidth={2} fill="url(#gradOmzet)" />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#34d399" strokeWidth={2} fill="url(#gradProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
