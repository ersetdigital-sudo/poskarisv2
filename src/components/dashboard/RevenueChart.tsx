'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: Array<{
    name: string
    omzet: number
    profit: number
    biaya?: number
  }>
  title: string
  subtitle?: string
}

export default function RevenueChart({ data, title, subtitle }: RevenueChartProps) {
  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold" style={{ fontWeight: 700 }}>
          {title}
        </CardTitle>
        {subtitle && (
          <CardDescription className="text-sm text-ash">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efefef" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#4b4b4b', fontSize: 12 }}
              axisLine={{ stroke: '#efefef' }}
            />
            <YAxis 
              tickFormatter={formatRupiah}
              tick={{ fill: '#4b4b4b', fontSize: 12 }}
              axisLine={{ stroke: '#efefef' }}
            />
            <Tooltip 
              formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
              }}
              labelStyle={{ color: '#000000', fontWeight: 700 }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="omzet" 
              fill="#000000" 
              name="Omzet"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="profit" 
              fill="#34d399" 
              name="Profit"
              radius={[4, 4, 0, 0]}
            />
            {data[0]?.biaya !== undefined && (
              <Bar 
                dataKey="biaya" 
                fill="#efefef" 
                name="Biaya"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
