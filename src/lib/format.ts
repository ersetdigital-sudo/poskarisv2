// Format helpers untuk dashboard

export function formatRupiah(n: number): string {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`
  return `Rp ${n}`
}

export function formatRupiahFull(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

// Hitung persentase perubahan vs periode sebelumnya
export function calcTrend(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) {
    return { pct: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' }
  }
  const diff = current - previous
  const pct = Math.abs(Math.round((diff / previous) * 100))
  return { pct, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }
}

// Format relative time "2 jam lalu"
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// Generate 7 hari terakhir labels
export function getLast7Days(): { label: string; date: Date; key: string }[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push({
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      date: d,
      key: d.toISOString().slice(0, 10),
    })
  }
  return days
}
