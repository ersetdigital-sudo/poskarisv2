'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CategoryChartProps {
  data: Array<{
    name: string
    value: number
    pct?: number
  }>
  title: string
  subtitle?: string
}

const COLORS = ['#000000', '#f59e0b', '#34d399', '#3b82f6', '#dc2626', '#efefef']

export default function CategoryChart({ data, title, subtitle }: CategoryChartProps) {
  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold" style={{ fontWeight: 700 }}>
          {title}
        </CardTitle>
        {subtitle && (
          <CardDescription className="text-xs text-ash">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          {/* Donut Chart */}
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatRupiah(Number(value))}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
                  fontSize: '11px'
                }}
                labelStyle={{ color: '#000000', fontWeight: 700 }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend with values */}
          <div className="space-y-1.5">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-ash truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.pct !== undefined && (
                    <span className="text-[10px] text-stone">{item.pct}%</span>
                  )}
                  <span className="text-xs font-bold text-ink font-mono">
                    {formatRupiah(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
