'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'

// ============================================
// Servis 7 Hari Terakhir (masuk vs selesai)
// ============================================
interface ServisChartProps {
  data: { day: string; masuk: number; selesai: number }[]
}

export function ServisWeeklyChart({ data }: ServisChartProps) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <h3 className="text-h3">Servis 7 Hari Terakhir</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginTop: 2 }}>Masuk vs Selesai</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--color-rule)', fontSize: 'var(--text-xs)', boxShadow: 'var(--shadow-md)' }}
            cursor={{ fill: 'var(--color-accent-soft)' }}
          />
          <Bar dataKey="masuk" fill="var(--color-accent)" radius={[3, 3, 0, 0]} name="Masuk" />
          <Bar dataKey="selesai" fill="var(--color-success)" radius={[3, 3, 0, 0]} name="Selesai" />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-2xs)', fontSize: 'var(--text-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-accent)' }} />
          <span style={{ color: 'var(--color-ink-3)' }}>Masuk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-success)' }} />
          <span style={{ color: 'var(--color-ink-3)' }}>Selesai</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Distribusi Stok (Donut Chart)
// ============================================
interface StokDistribusiProps {
  data: { name: string; value: number; color: string }[]
}

export function StokDonutChart({ data }: StokDistribusiProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <h3 className="text-h3">Distribusi Stok</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginTop: 2 }}>Status unit & sparepart</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <div style={{ width: 140, height: 140, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-rule)', fontSize: 'var(--text-xs)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>Total</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)', flex: 1 }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Omzet Mingguan (Line Chart)
// ============================================
interface OmzetChartProps {
  data: { day: string; omzet: number }[]
}

export function OmzetWeeklyChart({ data }: OmzetChartProps) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <h3 className="text-h3">Omzet Mingguan</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginTop: 2 }}>7 hari terakhir (servis + margin unit)</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="omzet-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--color-rule)', fontSize: 'var(--text-xs)', boxShadow: 'var(--shadow-md)' }}
            formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Omzet']}
          />
          <Line
            type="monotone"
            dataKey="omzet"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent)', r: 3 }}
            activeDot={{ r: 5 }}
            name="Omzet"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
