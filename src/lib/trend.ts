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
