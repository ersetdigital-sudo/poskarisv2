-- Fix RLS Policy untuk DELETE di tabel services
-- Jalankan di Supabase SQL Editor

-- 1. Enable RLS (kalau belum)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama yang mungkin nge-block
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON services;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON services;

-- 3. Buat policy baru untuk DELETE
CREATE POLICY "Allow delete for authenticated users"
ON services
FOR DELETE
TO authenticated
USING (true);

-- 4. Pastikan ada policy untuk SELECT, INSERT, UPDATE juga
DROP POLICY IF EXISTS "Allow select for authenticated users" ON services;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON services;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON services;

CREATE POLICY "Allow select for authenticated users"
ON services
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON services
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON services
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Fix RLS untuk service_parts (karena ada foreign key)
ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON service_parts;
CREATE POLICY "Allow all for authenticated users"
ON service_parts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Fix RLS untuk stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON stock_movements;
CREATE POLICY "Allow all for authenticated users"
ON stock_movements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Done! Sekarang admin bisa hapus servis
