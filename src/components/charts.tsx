'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ServisChartProps {
  data: { day: string; masuk: number; selesai: number }[]
}

export function ServisWeeklyChart({ data }: ServisChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Servis 7 Hari Terakhir</CardTitle>
        <p className="text-xs text-muted-foreground">Masuk vs Selesai</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', boxShadow: '0 4px 12px oklch(0% 0 0 / 0.08)' }}
              cursor={{ fill: 'var(--accent)' }}
            />
            <Bar dataKey="masuk" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Masuk" />
            <Bar dataKey="selesai" fill="#10b981" radius={[4, 4, 0, 0]} name="Selesai" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Selesai</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OmzetChartProps {
  data: { day: string; omzet: number }[]
}

export function OmzetWeeklyChart({ data }: OmzetChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Omzet Mingguan</CardTitle>
        <p className="text-xs text-muted-foreground">7 hari terakhir (servis + margin unit)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="omzet-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', boxShadow: '0 4px 12px oklch(0% 0 0 / 0.08)' }}
              formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Omzet']}
            />
            <Line type="monotone" dataKey="omzet" stroke="var(--primary)" strokeWidth={2}
              dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} name="Omzet" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface StokDistribusiProps {
  data: { name: string; value: number; color: string }[]
}

export function StokDonutChart({ data }: StokDistribusiProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Distribusi Stok</CardTitle>
        <p className="text-xs text-muted-foreground">Status unit & sparepart</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" cx="50%" cy="50%"
                  innerRadius={38} outerRadius={58} paddingAngle={2} stroke="none">
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-serif text-xl font-bold text-foreground">{total}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
