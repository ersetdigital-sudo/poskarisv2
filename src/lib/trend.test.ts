import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pctDelta, isGoodDelta, resolveTrend } from './trend.ts'

test('pctDelta signed: rugi makin besar => delta negatif (memburuk)', () => {
  assert.equal(pctDelta(-1_270_000, -680_000), -87)
})

test('pctDelta signed: rugi membaik => delta positif', () => {
  assert.equal(pctDelta(-680_000, -1_270_000), 46)
})

test('pctDelta signed: untung -> rugi => delta negatif', () => {
  assert.equal(pctDelta(-50_000, 100_000), -150)
})

test('pctDelta signed: rugi -> untung => delta positif', () => {
  assert.equal(pctDelta(100_000, -50_000), 300)
})

test('pctDelta signed: untung naik => delta positif, untung turun => negatif', () => {
  assert.equal(pctDelta(200_000, 100_000), 100)
  assert.equal(pctDelta(100_000, 200_000), -50)
})

test('pctDelta: previous 0 => null (tidak bisa dibandingkan)', () => {
  assert.equal(pctDelta(100_000, 0), null)
  assert.equal(pctDelta(0, 0), null)
})

test('isGoodDelta: metric revenue (naik = baik)', () => {
  assert.equal(isGoodDelta(10, false), true)
  assert.equal(isGoodDelta(-10, false), false)
  assert.equal(isGoodDelta(0, false), true)
})

test('isGoodDelta: metric biaya (invert, turun = baik)', () => {
  assert.equal(isGoodDelta(10, true), false)
  assert.equal(isGoodDelta(-10, true), true)
})

test('resolveTrend laba: rugi membesar -680rb -> -1.270.000 => panah turun + merah + 87%', () => {
  const delta = pctDelta(-1_270_000, -680_000)
  assert.equal(delta, -87)
  assert.deepEqual(resolveTrend(delta!, false), { up: false, good: false, pct: 87 })
})

test('resolveTrend laba: rugi mengecil -1.270.000 -> -680rb => panah naik + hijau + 46%', () => {
  const delta = pctDelta(-680_000, -1_270_000)
  assert.equal(delta, 46)
  assert.deepEqual(resolveTrend(delta!, false), { up: true, good: true, pct: 46 })
})

test('resolveTrend laba: untung -> rugi => panah turun + merah', () => {
  const delta = pctDelta(-50_000, 100_000)
  assert.deepEqual(resolveTrend(delta!, false), { up: false, good: false, pct: 150 })
})

test('resolveTrend laba: rugi -> untung => panah naik + hijau', () => {
  const delta = pctDelta(100_000, -50_000)
  assert.deepEqual(resolveTrend(delta!, false), { up: true, good: true, pct: 300 })
})

test('resolveTrend laba: untung kecil -> untung besar => naik + hijau, kebalikannya turun + merah', () => {
  assert.deepEqual(resolveTrend(pctDelta(200_000, 100_000)!, false), { up: true, good: true, pct: 100 })
  assert.deepEqual(resolveTrend(pctDelta(100_000, 200_000)!, false), { up: false, good: false, pct: 50 })
})

test('resolveTrend biaya (invert): biaya naik => panah naik + MERAH, biaya turun => panah turun + HIJAU', () => {
  assert.deepEqual(resolveTrend(pctDelta(1_500_000, 1_000_000)!, true), { up: true, good: false, pct: 50 })
  assert.deepEqual(resolveTrend(pctDelta(1_000_000, 1_500_000)!, true), { up: false, good: true, pct: 33 })
})
