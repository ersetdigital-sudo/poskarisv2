// Perubahan persentase secara SIGNED (memperhatikan arah):
// positif = naik, negatif = turun. Denominator pakai |previous|
// supaya arah tetap benar walau nilai sebelumnya negatif (rugi).
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

// Apakah arah perubahan dianggap "baik"?
// default (revenue/laba): naik = baik
// invert (cost): turun = baik
export function isGoodDelta(delta: number, invert: boolean): boolean {
  return invert ? delta < 0 : delta >= 0
}

export interface TrendBadge {
  // Arah panah mengikuti tanda delta SELALU (naik = delta positif, turun = delta negatif)
  up: boolean
  // Warna badge: good => hijau, bad => merah (baik/buruk mengikuti metric type)
  good: boolean
  // Besaran persentase tanpa tanda (absolut)
  pct: number
}

// Resolve lengkap badge trend: panah + warna + persentase.
// Arah panah SELALU ikut tanda delta (bukan besar-kecil persentase, bukan abs).
// Warna ikut isGoodDelta (invert untuk metric "naik = buruk" seperti biaya).
export function resolveTrend(delta: number, invert: boolean): TrendBadge {
  return {
    up: delta >= 0,
    good: isGoodDelta(delta, invert),
    pct: Math.abs(Math.round(delta)),
  }
}
