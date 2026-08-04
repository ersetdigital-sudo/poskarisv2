# Beli Sparepart + Fix Double Cost Laba — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah form "Beli Sparepart" yang mencatat pembelian sebagai pengeluaran toko (kurangi Laba Bersih) + tambah stok, dan hentikan double-counting cost sparepart di formula laba.

**Architecture:** Pembelian disimpan di tabel baru `sparepart_purchases` (expense channel terpisah dari `operational_costs`). Formula laba menjadi `omzetServis + marginUnit − biayaOperasional − pembelianSparepart`; `modalSparepart` (konsumsi servis) tidak lagi dikurangkan dari total, hanya jadi info per-transaksi. Pure math dipisah ke `finance-core.ts` agar bisa di-unit-test dengan node tanpa supabase.

**Tech Stack:** Next.js 16 (App Router, `'use client'`), Supabase (RLS admin pattern seperti `purchases`), React 19, Tailwind 4. Test: `node --test` (type stripping TS, pola `src/lib/trend.test.ts`). Typecheck: `npx tsc --noEmit`. Lint: `npx eslint <files>`.

## Global Constraints

- Nama kategori kanonik: `'Sparepart'` (exact match, lowercase trim, pola `stok/page.tsx:93`)
- Semua perubahan stok via `stock_movements` + trigger DB — JANGAN update `products.quantity` langsung
- `reference_type` mutasi pembelian sparepart = `'pembelian_sparepart'`
- Formula laba baru: `labaBersih = omzetServis + marginUnit − biayaOperasional − pembelianSparepart`
- `modalSparepart` tetap ada di `FinanceSummary` sebagai data info (dipakai dashboard `servisProfit` & tampilan per-servis), TAPI tidak dikurangkan dari `labaBersih`
- Field nama konsisten: `buy_price` (BIGINT rupiah), `quantity` (int > 0), `purchase_date` (DATE `'YYYY-MM-DD'`)
- Run command test: `node --test src/lib/<file>.test.ts`
- Run command typecheck: `npx tsc --noEmit` (dari root repo)

---

### Task 1: Migration DB — tabel `sparepart_purchases` + CHECK `stock_movements`

**Files:**
- Create: `supabase/migration_sparepart_purchases.sql`

**Interfaces:**
- Produces: tabel `public.sparepart_purchases` (kolom: id, product_id, name, quantity, buy_price, total, source_type, source_name, source_phone, purchase_date, notes, created_by, created_at); nilai `'pembelian_sparepart'` valid untuk `stock_movements.reference_type`

- [ ] **Step 1: Buat file migration**

```sql
-- ============================================
-- FITUR: BELI SPAREPART (pembelian = pengeluaran toko)
-- ============================================

-- 1. Tabel pembelian sparepart (expense channel, terpisah dari operational_costs)
CREATE TABLE IF NOT EXISTS public.sparepart_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  buy_price BIGINT NOT NULL,
  total BIGINT NOT NULL, -- buy_price * quantity
  source_type TEXT DEFAULT 'supplier' CHECK (source_type IN ('supplier', 'customer')),
  source_name TEXT,
  source_phone TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sparepart_purchases_date ON public.sparepart_purchases (purchase_date);
CREATE INDEX IF NOT EXISTS idx_sparepart_purchases_product ON public.sparepart_purchases (product_id);

ALTER TABLE public.sparepart_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view sparepart purchases" ON public.sparepart_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can create sparepart purchases" ON public.sparepart_purchases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete sparepart purchases" ON public.sparepart_purchases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Tambah nilai reference_type untuk mutasi stok masuk pembelian sparepart
ALTER TABLE public.stock_movements DROP CONSTRAINT stock_movements_reference_type_check;

ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_reference_type_check
  CHECK (reference_type IN ('pembelian_unit', 'penjualan_unit', 'servis', 'adjustment', 'pembelian_sparepart'));
```

- [ ] **Step 2: Verify SQL sintaks** (manual — jalankan di Supabase SQL Editor, bukan CI)

Jalankan isi file di Supabase Dashboard → SQL Editor. Diharapkan sukses tanpa error. Verifikasi:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'sparepart_purchases';
-- harus mengembalikan 13 baris kolom
SELECT constraint_name FROM pg_constraint WHERE conname = 'stock_movements_reference_type_check';
-- harus ada (nama constraint sama)
```
Catatan: nama constraint auto `stock_movements_reference_type_check` sesuai konvensi Postgres untuk CHECK tanpa nama eksplisit (lihat `schema.sql:121`). Kalau di environment kamu namanya beda, sesuaikan kedua ALTER (drop + add) di Step 1 sebelum dijalankan.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration_sparepart_purchases.sql
git commit -m "feat: migration sparepart_purchases + reference_type pembelian_sparepart"
```

---

### Task 2: Formula laba — ekstrak `finance-core.ts`, tambah `pembelianSparepart`, anti double-count

**Files:**
- Create: `src/lib/finance-core.ts`
- Create: `src/lib/finance-core.test.ts`
- Modify: `src/lib/finance.ts` (ganti body jadi re-export + `fetchFinanceData` dengan query `sparepart_purchases`)

**Interfaces:**
- Consumes: tabel `sparepart_purchases` (Task 1)
- Produces:
  - `export interface FinancePurchase { product_id: string | null; quantity: number; buy_price: number; purchase_date: string }`
  - `export function computeFinanceSummary(services: FinanceService[], sales: FinanceSale[], costs: FinanceCost[], parts: FinanceServicePart[] = [], purchases: FinancePurchase[] = []): FinanceSummary`
  - `FinanceSummary` mendapat field baru `pembelianSparepart: number`; `FinanceMonthly` mendapat `pembelianSparepart: number`
  - Semua tipe lama (`FinanceService`, `FinanceSale`, `FinanceServicePart`, `FinanceCost`, `FinancePeriod`, `FinanceSummary`, `FinanceMonthly`, `FinancePeriodData`, `buildPeriodRange`) tetap diekspor dari `@/lib/finance` (re-export), supaya konsumen lama tidak berubah impornya

- [ ] **Step 1: Tulis failing test** — `src/lib/finance-core.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeFinanceSummary, FinanceService, FinanceSale } from './finance-core.ts'

const mkService = (over: Partial<FinanceService>): FinanceService => ({
  id: 's1', nota_number: 'SRV-0001', customer_name: 'A', device_type: 'laptop',
  device_brand: null, service_fee: 0, parts_fee: 0, total_fee: 0, status: 'selesai',
  date_in: '2026-07-10T00:00:00.000Z', created_at: '2026-07-10T00:00:00.000Z', ...over,
})

const mkSale = (over: Partial<FinanceSale>): FinanceSale => ({
  id: 'sale1', invoice_number: 'JSP-0001', buyer_name: 'B', product_id: 'p1', product_name: 'RAM',
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
```

- [ ] **Step 2: Run test — verify RED**

Run: `node --test src/lib/finance-core.test.ts`
Expected: FAIL — `Cannot find module './finance-core.ts'`

- [ ] **Step 3: Buat `src/lib/finance-core.ts`** (semua yang pure, tanpa import supabase)

```ts
export interface FinancePeriod {
  year: number
  month: number | null
}

export interface FinanceMonthly {
  month: number
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biaya: number
  modalSparepart: number
  pembelianSparepart: number
  laba: number
}

export interface FinanceSummary {
  omzetServis: number
  omzetPenjualan: number
  marginUnit: number
  biayaOperasional: number
  modalSparepart: number
  pembelianSparepart: number
  labaBersih: number
  totalTransaksiServis: number
  totalTransaksiUnit: number
  monthly: FinanceMonthly[]
}

export interface FinanceService {
  id: string
  nota_number: string
  customer_name: string
  device_type: string
  device_brand: string | null
  service_fee: number
  parts_fee: number
  total_fee: number
  status: string
  date_in: string
  created_at: string
}

export interface FinanceSale {
  id: string
  invoice_number: string
  buyer_name: string
  product_id: string | null
  product_name: string
  sell_price: number
  buy_price: number
  margin: number
  status: string
  date: string
  created_at: string
}

export interface FinanceServicePart {
  service_id: string
  quantity: number
  buy_price: number
  date_in: string
}

export interface FinanceCost {
  amount: number
  period_month: number
  period_year: number
}

export interface FinancePurchase {
  product_id: string | null
  quantity: number
  buy_price: number
  purchase_date: string
}

export interface FinancePeriodData {
  summary: FinanceSummary
  services: FinanceService[]
  sales: FinanceSale[]
  costs: FinanceCost[]
  parts: FinanceServicePart[]
  purchases: FinancePurchase[]
}

const SERVICE_DONE = 'selesai'
const SALE_DONE = 'completed'

export function buildPeriodRange(period: FinancePeriod): { start: string; end: string } {
  const start = new Date(period.year, (period.month ?? 1) - 1, 1)
  const end = period.month != null
    ? new Date(period.year, period.month, 1)
    : new Date(period.year + 1, 0, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function computeFinanceSummary(
  services: FinanceService[],
  sales: FinanceSale[],
  costs: FinanceCost[],
  parts: FinanceServicePart[] = [],
  purchases: FinancePurchase[] = [],
): FinanceSummary {
  const doneServices = services.filter((s) => s.status === SERVICE_DONE)
  const doneSales = sales.filter((s) => s.status === SALE_DONE)

  const omzetServis = doneServices.reduce((sum, s) => sum + (s.total_fee || 0), 0)
  const omzetPenjualan = doneSales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
  const marginUnit = doneSales.reduce(
    (sum, s) => sum + (s.margin ?? (s.sell_price || 0) - (s.buy_price || 0)),
    0,
  )
  const biayaOperasional = costs.reduce((sum, c) => sum + (c.amount || 0), 0)
  const modalSparepart = parts.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
    0,
  )
  // Pembelian sparepart = pengeluaran toko saat beli (cash-basis).
  // modalSparepart (konsumsi di servis) TIDAK dikurangkan lagi => anti double-count.
  const pembelianSparepart = purchases.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
    0,
  )
  const labaBersih = omzetServis + marginUnit - biayaOperasional - pembelianSparepart

  const monthly: FinanceMonthly[] = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    const monthServices = doneServices.filter((s) => new Date(s.date_in).getMonth() === idx)
    const monthSales = doneSales.filter((s) => new Date(s.date).getMonth() === idx)
    const monthParts = parts.filter((p) => new Date(p.date_in).getMonth() === idx)
    const monthPurchases = purchases.filter((p) => new Date(p.purchase_date).getMonth() === idx)
    const monthOmzetServis = monthServices.reduce((sum, s) => sum + (s.total_fee || 0), 0)
    const monthOmzetPenjualan = monthSales.reduce((sum, s) => sum + (s.sell_price || 0), 0)
    const monthMarginUnit = monthSales.reduce(
      (sum, s) => sum + (s.margin ?? (s.sell_price || 0) - (s.buy_price || 0)),
      0,
    )
    const biaya = costs
      .filter((c) => c.period_month === month)
      .reduce((sum, c) => sum + (c.amount || 0), 0)
    const modalSparepart = monthParts.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
      0,
    )
    const pembelianSparepart = monthPurchases.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.buy_price || 0),
      0,
    )
    return {
      month,
      omzetServis: monthOmzetServis,
      omzetPenjualan: monthOmzetPenjualan,
      marginUnit: monthMarginUnit,
      biaya,
      modalSparepart,
      pembelianSparepart,
      laba: monthOmzetServis + monthMarginUnit - biaya - pembelianSparepart,
    }
  })

  return {
    omzetServis,
    omzetPenjualan,
    marginUnit,
    biayaOperasional,
    modalSparepart,
    pembelianSparepart,
    labaBersih,
    totalTransaksiServis: doneServices.length,
    totalTransaksiUnit: doneSales.length,
    monthly,
  }
}
```

- [ ] **Step 4: Run test — verify GREEN**

Run: `node --test src/lib/finance-core.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Rewrite `src/lib/finance.ts`** jadi re-export + `fetchFinanceData` query `sparepart_purchases`

```ts
import { supabase } from '@/lib/supabase'
import { buildPeriodRange, computeFinanceSummary } from './finance-core'
import type { FinancePeriodData, FinancePurchase, FinanceSale, FinanceServicePart } from './finance-core'

export * from './finance-core'

export async function fetchFinanceData(period: FinancePeriod): Promise<FinancePeriodData> {
  const { start, end } = buildPeriodRange(period)

  const servicesQuery = supabase
    .from('services')
    .select(
      'id, nota_number, customer_name, device_type, device_brand, service_fee, parts_fee, total_fee, status, date_in, created_at',
    )
    .gte('date_in', start)
    .lt('date_in', end)

  const salesQuery = supabase
    .from('sales')
    .select(
      'id, invoice_number, buyer_name, product_id, sell_price, buy_price, margin, status, date, created_at, products(name)',
    )
    .gte('date', start)
    .lt('date', end)

  let costsQuery = supabase
    .from('operational_costs')
    .select('amount, period_month, period_year')
    .eq('period_year', period.year)
  if (period.month != null) {
    costsQuery = costsQuery.eq('period_month', period.month)
  }

  const partsQuery = supabase
    .from('service_parts')
    .select('service_id, quantity, buy_price, services!inner(status, date_in)')
    .eq('services.status', 'selesai')
    .gte('services.date_in', start)
    .lt('services.date_in', end)

  // Bandingkan pakai bagian tanggal saja ('YYYY-MM-DD') karena purchase_date bertipe DATE —
  // bandingkan dengan timestamp ISO bisa salah atribusi bulan di zona waktu +07:00.
  const purchasesQuery = supabase
    .from('sparepart_purchases')
    .select('product_id, quantity, buy_price, purchase_date')
    .gte('purchase_date', start.slice(0, 10))
    .lt('purchase_date', end.slice(0, 10))

  const [servicesRes, salesRes, costsRes, partsRes, purchasesRes] = await Promise.all([
    servicesQuery,
    salesQuery,
    costsQuery,
    partsQuery,
    purchasesQuery,
  ])

  const services = servicesRes.data || []
  const sales: FinanceSale[] = (salesRes.data || []).map((s) => ({
    id: s.id,
    invoice_number: s.invoice_number,
    buyer_name: s.buyer_name,
    product_id: s.product_id,
    product_name: s.products?.[0]?.name || '',
    sell_price: s.sell_price,
    buy_price: s.buy_price,
    margin: s.margin,
    status: s.status,
    date: s.date,
    created_at: s.created_at,
  }))
  const costs = costsRes.data || []
  const parts: FinanceServicePart[] = (partsRes.data || []).map((p) => ({
    service_id: p.service_id,
    quantity: p.quantity,
    buy_price: p.buy_price,
    date_in: p.services?.[0]?.date_in || '',
  }))
  const purchases: FinancePurchase[] = (purchasesRes.data || []).map((p) => ({
    product_id: p.product_id,
    quantity: p.quantity,
    buy_price: p.buy_price,
    purchase_date: p.purchase_date,
  }))

  return {
    services,
    sales,
    costs,
    parts,
    purchases,
    summary: computeFinanceSummary(services, sales, costs, parts, purchases),
  }
}
```

- [ ] **Step 6: Verify — run tests + typecheck**

Run: `node --test src/lib/finance-core.test.ts; npx tsc --noEmit`
Expected: tests PASS, tsc tanpa output (0 error)

- [ ] **Step 7: Commit**

```bash
git add src/lib/finance-core.ts src/lib/finance-core.test.ts src/lib/finance.ts
git commit -m "fix: formula laba — pembelian sparepart jadi expense, modal konsumsi servis tidak lagi double-count"
```

---

### Task 3: Konsumen formula — Laporan (harian, segmented, rincian laba rugi) & DailyTable

**Files:**
- Modify: `src/app/(dashboard)/laporan/page.tsx`
- Modify: `src/components/laporan/DailyTable.tsx`

**Interfaces:**
- Consumes: `FinanceSummary.pembelianSparepart`, `FinancePeriodData.purchases: FinancePurchase[]` (Task 2)

- [ ] **Step 1: `DailyTable.tsx` — rename field `modalSparepart` → `pembelianSparepart`**

Di `src/components/laporan/DailyTable.tsx` ganti SEMUA `modalSparepart` menjadi `pembelianSparepart` (interface `DailyRow` baris 11, reduce baris 33/38, mobile label baris 75, desktop header baris 98, cell baris 117-118, totals baris 135). Label teks "Modal Sparepart" → "Pembelian Sparepart" (dua tempat: mobile card baris 75, desktop header baris 98).

- [ ] **Step 2: `laporan/page.tsx` — interface `LaporanData` + destructure + state**

Ganti interface:
```ts
interface LaporanData {
  omzetServis: number; omzetPenjualan: number; marginUnit: number;
  biayaOperasional: number; pembelianSparepart: number; labaBersih: number;
  totalTransaksiServis: number; totalTransaksiUnit: number;
}
```

Ganti destructure (baris 61):
```ts
const { summary, services: servisData, sales: salesData, purchases } = cur
```

Ganti setData (baris 67):
```ts
pembelianSparepart: summary.pembelianSparepart,
```
(hapus baris `modalSparepart: summary.modalSparepart`)

Ganti useState initial (baris 38): `modalSparepart: 0` → `pembelianSparepart: 0`

- [ ] **Step 3: `laporan/page.tsx` — rekap harian pakai pembelian, bukan konsumsi**

Ganti `addDay` (baris 92):
```ts
const addDay = (day: string) => {
  if (!dailyMap[day]) dailyMap[day] = { date: day, omzetServis: 0, omzetUnit: 0, marginUnit: 0, pembelianSparepart: 0, profit: 0, countServis: 0, countUnit: 0 }
}
```

Hapus blok `parts?.forEach(...)` (baris 111-115) dan ganti dengan:
```ts
purchases?.forEach(p => {
  const day = (p.purchase_date || '').slice(0, 10)
  addDay(day)
  dailyMap[day].pembelianSparepart += (p.quantity || 0) * (p.buy_price || 0)
})
```

Ganti formula profit harian (baris 117):
```ts
daily.forEach(d => { d.profit = d.omzetServis + d.marginUnit - d.pembelianSparepart })
```

- [ ] **Step 4: `laporan/page.tsx` — segmented bar & RincianLabaRugi**

Ganti segmen (baris 161):
```ts
{ label: 'Pembelian Sparepart', value: data.pembelianSparepart, color: 'bg-badge-warning' },
```

Ganti baris RincianLabaRugi (baris 429):
```ts
{ label: '(-) Pembelian Sparepart', value: data.pembelianSparepart, kind: 'out' },
```

- [ ] **Step 5: Verify — typecheck + lint**

Run: `npx tsc --noEmit; npx eslint "src/app/(dashboard)/laporan/page.tsx" "src/components/laporan/DailyTable.tsx"`
Expected: tidak ada error baru (abaikan `react-hooks/immutability` baris 50 yang sudah pre-existing)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/laporan/page.tsx" "src/components/laporan/DailyTable.tsx"
git commit -m "fix: laporan — pembelian sparepart jadi pengurang harian & rincian laba rugi, ganti konsumsi servis"
```

---

### Task 4: Halaman "Beli Sparepart" (`/stok/beli-sparepart`)

**Files:**
- Create: `src/app/(dashboard)/stok/beli-sparepart/page.tsx`

**Interfaces:**
- Consumes: tabel `sparepart_purchases`, nilai `'pembelian_sparepart'` (Task 1); `supabase` dari `@/lib/supabase`; `useAuth` dari `@/lib/auth-context`
- Produces: route `/stok/beli-sparepart` yang di-link dari halaman Stok (Task 5)

- [ ] **Step 1: Buat halaman form**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RupiahInput } from '@/components/ui/rupiah-input'

const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
const selectClass = 'h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'
const textareaClass = 'w-full resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20'

const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Category { id: string; name: string }

export default function BeliSparepartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    name: '', category_id: '', specs: '', condition: 'baru' as 'baru' | 'bekas' | 'refurbished',
    buy_price: 0, sell_price: 0, quantity: 1,
    source_type: 'supplier' as 'supplier' | 'customer', source_name: '', source_phone: '',
    purchase_date: todayLocal(), notes: '',
  })

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      setCategories(data || [])
      const sparepart = (data || []).find(c => c.name.toLowerCase().trim() === 'sparepart')
      setForm(f => ({ ...f, category_id: f.category_id || sparepart?.id || '' }))
    })
  }, [])

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const marginPerUnit = form.sell_price > 0 ? form.sell_price - form.buy_price : 0
  const potensiMargin = marginPerUnit * form.quantity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.category_id) { setError('Pilih kategori terlebih dahulu'); return }
    setLoading(true)
    setError('')
    try {
      // 1. Cari produk existing by nama + kategori
      let { data: existing } = await supabase.from('products')
        .select('id').eq('name', form.name.trim()).eq('category_id', form.category_id).maybeSingle()

      let productId: string
      if (existing) {
        const patch: Record<string, unknown> = { buy_price: form.buy_price }
        if (form.sell_price > 0) patch.sell_price = form.sell_price
        const { error: updErr } = await supabase.from('products').update(patch).eq('id', existing.id)
        if (updErr) throw updErr
        productId = existing.id
      } else {
        const { data: product, error: productError } = await supabase.from('products').insert({
          category_id: form.category_id, name: form.name.trim(), specs: form.specs || null,
          condition: form.condition, buy_price: form.buy_price, sell_price: form.sell_price,
          quantity: 0, status: 'ready',
        }).select('id').single()
        if (productError) throw productError
        productId = product.id
      }

      // 2. Catat pembelian = pengeluaran toko
      const total = form.buy_price * form.quantity
      const { data: purchase, error: purchaseError } = await supabase.from('sparepart_purchases').insert({
        product_id: productId, name: form.name.trim(), quantity: form.quantity,
        buy_price: form.buy_price, total,
        source_type: form.source_type, source_name: form.source_name || null, source_phone: form.source_phone || null,
        purchase_date: form.purchase_date, notes: form.notes || null, created_by: user?.id,
      }).select('id').single()
      if (purchaseError) throw purchaseError

      // 3. Mutasi stok masuk (trigger update qty di DB)
      const { error: movErr } = await supabase.from('stock_movements').insert({
        product_id: productId, type: 'masuk', quantity: form.quantity, reference_type: 'pembelian_sparepart',
        reference_id: purchase.id, notes: `Pembelian sparepart ${form.name.trim()}`, created_by: user?.id,
      })
      if (movErr) throw movErr

      router.push('/stok')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="secondary" className="h-9 w-9 shrink-0 p-0">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-foreground">Beli Sparepart</h1>
          <p className="text-xs text-muted-foreground">Pembelian tercatat sebagai pengeluaran toko & menambah stok</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nama Sparepart *</label>
                  <Input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RAM DDR4 8GB" className="h-10 w-full" />
                </div>
                <div>
                  <label className={labelClass}>Kategori *</label>
                  <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={selectClass}>
                    <option value="">Pilih kategori…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Spesifikasi</label>
                <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} placeholder="128GB SATA" rows={2} className={textareaClass} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Kondisi *</label>
                  <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as 'baru' | 'bekas' | 'refurbished' })} className={selectClass}>
                    <option value="baru">Baru</option><option value="bekas">Bekas</option><option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Qty/Stok *</label>
                  <Input type="number" min={1} required value={form.quantity} onChange={e => setForm({ ...form, quantity: Math.max(1, Number(e.target.value) || 1) })} className="h-10 w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Harga Beli (Rp) *</label>
                  <RupiahInput value={form.buy_price} onChange={v => setForm({ ...form, buy_price: v })} className="h-10 w-full font-mono" />
                </div>
                <div>
                  <label className={labelClass}>Harga Jual (Rp)</label>
                  <RupiahInput value={form.sell_price} onChange={v => setForm({ ...form, sell_price: v })} className="h-10 w-full font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                <span className="text-sm text-muted-foreground">Potensi Margin ({form.quantity} × {formatRupiah(marginPerUnit)})</span>
                <span className="font-mono text-base font-bold text-badge-success">{formatRupiah(potensiMargin)}</span>
              </div>

              <div>
                <label className={labelClass}>Tanggal Pembelian</label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className="h-10 w-full" />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Sumber Pembelian</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Tipe</label>
                    <select value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value as 'supplier' | 'customer' })} className={selectClass}>
                      <option value="supplier">Supplier</option><option value="customer">Customer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nama</label>
                    <Input type="text" value={form.source_name} onChange={e => setForm({ ...form, source_name: e.target.value })} className="h-10 w-full" />
                  </div>
                  <div>
                    <label className={labelClass}>No. HP</label>
                    <Input type="text" value={form.source_phone} onChange={e => setForm({ ...form, source_phone: e.target.value })} className="h-10 w-full" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
                <Button type="button" onClick={() => router.back()} variant="secondary" className="h-11 w-full sm:flex-1">Batal</Button>
                <Button type="submit" disabled={loading} className="h-11 w-full sm:flex-1">{loading ? 'Menyimpan...' : 'Simpan Pembelian'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify — typecheck + lint**

Run: `npx tsc --noEmit; npx eslint "src/app/(dashboard)/stok/beli-sparepart/page.tsx"`
Expected: bersih (0 error)

Catatan testing: kodebase ini tidak punya infrastruktur test komponen (tidak ada jest/testing-library); alur simpan memanggil Supabase langsung. Verifikasi alur beli dilakukan manual (daftar skenario di Task 5 Step 4) — pengecualian TDD ini sudah disetujui di sesi brainstorming (mengikuti pola `unit-laptop/beli` yang juga tanpa test).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/stok/beli-sparepart/page.tsx"
git commit -m "feat: halaman beli sparepart — expense toko + mutasi stok masuk"
```

---

### Task 5: Tombol masuk di Stok + cascade delete

**Files:**
- Modify: `src/app/(dashboard)/stok/page.tsx`

**Interfaces:**
- Consumes: route `/stok/beli-sparepart` (Task 4); tabel `sparepart_purchases` (Task 1)

- [ ] **Step 1: Tambah tombol "Beli Sparepart" di PageHeader**

Di `stok/page.tsx` grid tombol (sebelum `<Link href="/unit-laptop/beli">`, setelah Kategori di sekitar baris 136), tambah:

```tsx
<Link href="/stok/beli-sparepart" className="sm:flex-none">
  <Button variant="secondary" className="w-full sm:w-auto gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm">
    <ArrowDownToLine size={14} strokeWidth={2} className="sm:w-4 sm:h-4" />
    Beli Sparepart
  </Button>
</Link>
```

(`ArrowDownToLine` sudah diimpor di file ini — dipakai tombol "Beli Unit".)

- [ ] **Step 2: Tambah cascade delete `sparepart_purchases`**

Di `handleDeleteProduct` (baris 74-78), tambah setelah hapus `purchases`:

```ts
await supabase.from('sparepart_purchases').delete().eq('product_id', product.id)
```

- [ ] **Step 3: Verify — typecheck + lint**

Run: `npx tsc --noEmit; npx eslint "src/app/(dashboard)/stok/page.tsx"`
Expected: tidak ada error baru

- [ ] **Step 4: Uji manual end-to-end (jalankan `npm run dev`)**

1. Halaman Stok → klik "Beli Sparepart" → form terbuka, kategori default "Sparepart"
2. Isi: Nama "RAM DDR4 8GB", Harga Beli 50.000, Qty 5, Harga Jual 75.000 → Potensi Margin tampil 125.000 (5 × 25.000)
3. Simpan → redirect ke /stok, item "RAM DDR4 8GB" muncul dengan stok 5, buy_price 50.000, sell_price 75.000
4. Buka Laporan → Rincian Laba Rugi menampilkan "(-) Pembelian Sparepart" Rp250.000; Laba Bersih berkurang 250.000
5. Beli lagi "RAM DDR4 8GB" qty 2 harga 55.000 → stok jadi 7, buy_price jadi 55.000 (harga terbaru), sell_price tetap 75.000
6. Buat servis pakai 2 pcs RAM → Omzet Servis naik sesuai harga ke customer; Laporan: Laba Bersih TIDAK berkurang lagi untuk cost RAM (anti double-count); halaman Servis tetap menampilkan kolom "Modal Sparepart" per transaksi
7. Jual 1 pcs RAM langsung (halaman Jual) → margin masuk ke laba, stok berkurang
8. Hapus produk RAM di Stok → semua data terkait (termasuk sparepart_purchases) ikut terhapus, tanpa error

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/stok/page.tsx"
git commit -m "feat: tombol beli sparepart di halaman stok + cascade delete sparepart_purchases"
```

---

## Self-Review (dijalankan setelah plan ditulis)

- [ ] Spec coverage: migration (T1), formula anti double-count (T2), konsumen laporan/daily (T3), halaman form (T4), tombol+cascade (T5), testing skenario manual (T5.4) — semua bagian spec ter-cover
- [ ] Placeholder scan: tidak ada TBD/TODO; semua step berisi kode konkret
- [ ] Type consistency: `FinancePurchase`, `pembelianSparepart`, `purchases` dipakai konsisten di T2-T3; `'pembelian_sparepart'` konsisten di T1/T4; `DailyRow.pembelianSparepart` konsisten T3
