import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeFinanceSummary, type FinanceService, type FinanceSale } from './finance-core.ts'

const mkService = (over: Partial<FinanceService>): FinanceService => ({
  id: 's1', nota_number: 'SRV-0001', customer_name: 'A', device_type: 'laptop',
  device_brand: null, service_fee: 0, parts_fee: 0, total_fee: 0, status: 'selesai',
  date_in: '2026-07-10T00:00:00.000Z', created_at: '2026-07-10T00:00:00.000Z', ...over,
})

const mkSale = (over: Partial<FinanceSale>): FinanceSale => ({
  id: 'sale1', invoice_number: 'JSP-0001', buyer_name: 'B', product_id: 'p1', product_name: 'RAM',
  item_type: 'unit', quantity: 1,
  sell_price: 150_000, buy_price: 100_000, margin: 50_000, status: 'completed',
  date: '2026-07-20T00:00:00.000Z', created_at: '2026-07-20T00:00:00.000Z', ...over,
})

test('beli sparepart 250.000 (5 x 50.000) mengurangi laba bersih & stok dihitung', () => {
  const s = computeFinanceSummary([], [], [], [], [
    { product_id: 'p1', quantity: 5, buy_price: 50_000, purchase_date: '2026-07-15' },
  ])
  assert.equal(s.pembelianSparepart, 250_000)
  assert.equal(s.labaBersih, -250_000)
})

test('anti double-count: sparepart dipakai servis selesai, laba tidak berkurang lagi untuk modal konsumsi', () => {
  const s = computeFinanceSummary(
    [mkService({ id: 's1', total_fee: 300_000, parts_fee: 100_000, service_fee: 200_000 })],
    [],
    [],
    [{ service_id: 's1', quantity: 2, buy_price: 50_000, date_in: '2026-07-10T00:00:00.000Z' }],
    [{ product_id: 'p1', quantity: 2, buy_price: 50_000, purchase_date: '2026-07-05' }],
  )
  assert.equal(s.modalSparepart, 100_000) // info per-servis tetap ada
  assert.equal(s.labaBersih, 300_000 - 100_000) // cuma omzet minus pembelian; modal konsumsi TIDAK dikurang
})

test('sparepart dijual langsung: margin masuk laba (omzet + modalSparepart kosong)', () => {
  const s = computeFinanceSummary([], [mkSale({})], [], [], [])
  assert.equal(s.omzetPenjualan, 150_000)
  assert.equal(s.marginUnit, 50_000)
  assert.equal(s.labaBersih, 50_000)
})

test('breakdown bulanan: pembelian masuk bulan sesuai purchase_date', () => {
  const s = computeFinanceSummary([], [], [], [], [
    { product_id: 'p1', quantity: 1, buy_price: 100_000, purchase_date: '2026-07-15' },
    { product_id: 'p1', quantity: 1, buy_price: 50_000, purchase_date: '2026-08-02' },
  ])
  assert.equal(s.monthly[6].pembelianSparepart, 100_000)
  assert.equal(s.monthly[7].pembelianSparepart, 50_000)
  assert.equal(s.monthly[6].laba, -100_000)
  assert.equal(s.labaBersih, -150_000)
})

test('modalSparepart konsumsi tidak lagi mempengaruhi labaBersih (regresi)', () => {
  const s = computeFinanceSummary(
    [mkService({ id: 's1', total_fee: 300_000, parts_fee: 100_000 })],
    [], [], [{ service_id: 's1', quantity: 2, buy_price: 50_000, date_in: '2026-07-10T00:00:00.000Z' }],
    [],
  )
  assert.equal(s.modalSparepart, 100_000)
  assert.equal(s.labaBersih, 300_000) // tanpa pembelian tercatat, konsumsi tidak mengurangkan
})