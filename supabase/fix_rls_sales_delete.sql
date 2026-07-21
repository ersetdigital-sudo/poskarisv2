-- Fix RLS Policy untuk DELETE di tabel sales
-- Jalankan di Supabase SQL Editor

-- Enable RLS (kalau belum)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang mungkin nge-block
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sales;

-- Buat policy baru untuk DELETE
CREATE POLICY "Allow delete for authenticated users"
ON sales
FOR DELETE
TO authenticated
USING (true);

-- Pastikan ada policy untuk SELECT, INSERT, UPDATE juga
DROP POLICY IF EXISTS "Allow select for authenticated users" ON sales;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON sales;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON sales;

CREATE POLICY "Allow select for authenticated users"
ON sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix RLS Policy untuk DELETE di tabel products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;

CREATE POLICY "Allow delete for authenticated users"
ON products
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow select for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON products;

CREATE POLICY "Allow select for authenticated users"
ON products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix RLS Policy untuk purchases (supaya bisa cek sebelum hapus produk)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON purchases;
CREATE POLICY "Allow all for authenticated users"
ON purchases
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix RLS Policy untuk categories (supaya bisa manage kategori)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
CREATE POLICY "Allow all for authenticated users"
ON categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Done! Sekarang admin bisa hapus transaksi penjualan & produk
