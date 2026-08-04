# Design: Fitur "Beli Sparepart" + Fix Logic Laba (Cegah Double Cost)

Tanggal: 2026-08-04
Status: Disetujui di chat, menunggu review spec

## Latar Belakang Bisnis (dikonfirmasi ke customer)

- **Beli sparepart** → langsung jadi pengeluaran/biaya toko saat dicatat (mengurangi Laba Bersih), sekaligus menambah stok sparepart (cash-basis, bukan akuntansi aset)
- **Sparepart dijual langsung** → jadi pemasukan toko
- **Sparepart dipakai di transaksi servis** → harga yang dikenakan ke customer masuk sebagai pemasukan (bagian dari Omzet Servis); kolom "Jasa Servis" terpisah

## Masalah yang Diperbaiki

Formula laba saat ini (`src/lib/finance.ts:111`):

```
labaBersih = omzetServis + marginUnit − biayaOperasional − modalSparepart
```

`modalSparepart` = Σ `service_parts.quantity × buy_price` (snapshot HPP saat sparepart dipakai di servis selesai). Beli unit/sparepart sama sekali tidak tercatat sebagai expense (tabel `purchases` tidak dibaca finance.ts).

Dengan fitur baru (beli sparepart = expense langsung), jika `modalSparepart` konsumsi masih ikut dikurangkan, cost sparepart kepotong 2x: sekali saat beli, sekali saat dipakai di servis.

## Keputusan yang Sudah Dikonfirmasi

1. Expense pembelian sparepart disimpan di **tabel baru `sparepart_purchases`** (bukan reuse `operational_costs` / extend `purchases`)
2. Merge item existing by nama: **`buy_price` di-update ke harga beli terbaru**; `sell_price` diisi hanya kalau form diisi (tidak menimpa harga jual existing)
3. Laba bulan-bulan lalu yang dihitung ulang otomatis berubah (konsumsi tak lagi dikurangkan) — konsekuensi formula baru, dianggap wajar

## 1. Database (1 file migration baru: `supabase/migration_sparepart_purchases.sql`)

### Tabel `sparepart_purchases`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| product_id | uuid NOT NULL REFERENCES products ON DELETE CASCADE | |
| name | text | nama sparepart |
| quantity | int NOT NULL DEFAULT 1 | qty dibeli |
| buy_price | bigint NOT NULL | harga beli satuan |
| total | bigint NOT NULL | buy_price × quantity (dihitung di app) |
| source_type | text CHECK ('supplier' \| 'customer') DEFAULT 'supplier' | |
| source_name | text | |
| source_phone | text | |
| purchase_date | date DEFAULT CURRENT_DATE | atribusi periode & harian |
| notes | text | |
| created_by | uuid REFERENCES profiles | |
| created_at | timestamptz DEFAULT now() | |

Index: `purchase_date`, `product_id`. RLS: insert/select/delete untuk `authenticated` (pola tabel lain di schema.sql).

### Alter `stock_movements`

`reference_type` CHECK saat ini: `('pembelian_unit','penjualan_unit','servis','adjustment')` → tambah `'pembelian_sparepart'` (drop constraint, create ulang).

## 2. Formula Laba (`src/lib/finance.ts`)

```
labaBersih = omzetServis + marginUnit − biayaOperasional − pembelianSparepart
```

- `pembelianSparepart` = Σ `sparepart_purchases.total` per periode (filter `purchase_date` dalam range, pola sama seperti `operational_costs`)
- `modalSparepart` (konsumsi servis) **dihapus dari perhitungan total laba**, tetap dipertahankan sebagai data:
  - Kolom "Modal Sparepart" per transaksi servis di halaman Servis & detail (info margin — sudah terpisah, query sendiri)
  - Chart "Profit per Kategori" dashboard (`servisProfit = omzetServis − modalSparepart`) — info margin per kategori
- `computeFinanceSummary(services, sales, costs, parts, purchases)` — parameter ke-5 ditambah
- `fetchFinanceData` query `sparepart_purchases` per periode

### Konsumen yang berubah (Laporan & Dashboard)

- `laporan/page.tsx`:
  - RincianLabaRugi: baris `(-) Modal Sparepart` → `(-) Pembelian Sparepart`, nilai = pembelian
  - Segmented bar mobile hero: segmen Modal Sparepart → Pembelian Sparepart
  - Daily profit: `profit = omzetServis + marginUnit − pembelianSparepart` (per hari, by `purchase_date`)
- `DailyTable.tsx`: kolom modal → pembelian per hari, label disesuaikan
- `dashboard/page.tsx`: `totalProfit` otomatis ikut formula baru; `servisProfit` chart tetap (info)
- KPI "Biaya Operasional" & fix trend indicator TIDAK tersentuh

## 3. UI: Halaman "Beli Sparepart" (`/stok/beli-sparepart`)

### Tombol masuk

Halaman Stok Barang (`stok/page.tsx`, PageHeader ~line 131-159): tombol "Beli Sparepart" sebaris dengan "Beli Unit".

### Form (pola `unit-laptop/beli/page.tsx`)

| Field | Tipe | Keterangan |
|---|---|---|
| Nama Sparepart | text, wajib | `products.name` |
| Kategori | dropdown, wajib | dari `categories`, default "Sparepart" |
| Spesifikasi | text, opsional | `products.specs`, placeholder "128GB SATA" |
| Kondisi | select, wajib | `baru` / `bekas` (default `baru`) |
| Harga Beli | RupiahInput, wajib | |
| Harga Jual | RupiahInput, opsional | |
| Qty | number, wajib, default 1 | |
| Potensi Margin | read-only, live | (harga jual − harga beli) × qty, kalau harga jual diisi |
| Tanggal Pembelian | date input, default hari ini | `purchase_date` — atribusi periode & harian, boleh backdate (pola `cost_date` di halaman Operasional) |
| Sumber Pembelian | select + 2 text | Tipe (Supplier/Customer), Nama, No. HP |
| Catatan | textarea, opsional | |

### Alur simpan (client-side sequential, pola Beli Unit)

1. Cari produk: `products.eq('name', nama).eq('category_id', catId).maybeSingle()`
2. Ada → update `buy_price` (selalu), `sell_price` (hanya kalau diisi)
   Baru → insert `products` `{ category_id, name, specs, condition, buy_price, sell_price, quantity: 0, status: 'ready' }`
3. Insert `sparepart_purchases` `{ product_id, name, quantity, buy_price, total, source_type, source_name, source_phone, purchase_date, notes, created_by }`
4. Insert `stock_movements` `{ product_id, type: 'masuk', quantity, reference_type: 'pembelian_sparepart', reference_id: purchase.id, notes, created_by }` (trigger update qty)
5. `router.push('/stok')` + `router.refresh()`

### Delete produk di Stok

`stok/page.tsx:74-79` cascade: tambah hapus `sparepart_purchases` (FK sudah ON DELETE CASCADE di DB, pastikan baris penghapusan eksplisit di kode mengikuti pola yang ada — delete by product_id).

## 4. Error Handling

- Mengikuti pola Beli Unit (sequential, tanpa transaksi DB server-side)
- Kalau insert gagal di tengah: tampilkan toast/error, jangan redirect (kondisi data sebagian tidak di-rollback — konsisten dengan pola existing)
- Kategori "Sparepart" tidak ada? Dropdown berisi kategori existing; form tetap bisa pakai kategori lain

## 5. Testing

### Unit test `computeFinanceSummary` (node, pola `src/lib/trend.test.ts`)

- Beli sparepart Rp250.000 (qty 5 × 50.000) → labaBersih berkurang 250.000
- Sparepart dipakai di servis selesai → omzetServis bertambah sesuai harga customer, laba TIDAK berkurang lagi untuk cost sparepart (double-count tercegah)
- Sparepart dijual langsung → marginUnit bertambah
- `modalSparepart` konsumsi tetap tersedia di summary (info)
- Breakdown bulanan: `pembelianSparepart` per bulan benar

### Manual

- Beli sparepart 250rb → laba −250rb, stok nambah
- Sparepart dipakai di servis → omzet servis nambah, laba tidak berkurang lagi
- Kolom modal per servis tetap tampil (info)
- Jual langsung → pemasukan sesuai harga jual

## Scope Note

Beli Unit tetap expense saat terjual (lewat kolom `margin` sales), bukan saat beli — inkonsistensi akuntansi vs sparepart, DI LUAR scope fitur ini (dicatat untuk keputusan terpisah).
