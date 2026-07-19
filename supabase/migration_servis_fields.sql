-- Migration: Tambah field kelengkapan, garansi, dan warranty_end_date ke tabel services
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom kelengkapan (barang bawaan customer)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS kelengkapan TEXT;

-- 2. Tambah kolom garansi (durasi garansi)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS garansi TEXT DEFAULT 'Tanpa Garansi';

-- 3. Tambah kolom warranty_end_date (tanggal berakhir garansi)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS warranty_end_date TIMESTAMPTZ;

-- Update comment
COMMENT ON COLUMN public.services.kelengkapan IS 'Barang bawaan customer (Charger, Tas, dll)';
COMMENT ON COLUMN public.services.garansi IS 'Durasi garansi: Tanpa Garansi, 7 Hari, 14 Hari, 30 Hari, 3 Bulan';
COMMENT ON COLUMN public.services.warranty_end_date IS 'Tanggal berakhir garansi (otomatis dihitung dari date_out + durasi garansi)';
