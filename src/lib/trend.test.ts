import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pctDelta, isGoodDelta } from './trend.ts'

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
