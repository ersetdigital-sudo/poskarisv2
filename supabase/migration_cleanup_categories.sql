-- Migration: Bersihkan kategori duplikat
-- Jalankan di Supabase SQL Editor

-- 1. Lihat kategori yang ada (cek duplikat)
-- SELECT id, name, description FROM public.categories ORDER BY name;

-- 2. Update produk yang pakai kategori duplikat ke kategori utama
-- (Ganti UUID di bawah dengan ID kategori yang benar)

-- Contoh: Jika ada 2 kategori "Laptop", pindahkan produk ke salah satu
-- UPDATE public.products 
-- SET category_id = 'UUID_KATEGORI_UTAMA'
-- WHERE category_id = 'UUID_KATEGORI_DUPLIKAT';

-- 3. Hapus kategori duplikat (setelah produk dipindahkan)
-- DELETE FROM public.categories WHERE id = 'UUID_KATEGORI_DUPLIKAT';

-- 4. Tambah constraint unique nama kategori (case-insensitive)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique 
-- ON public.categories (LOWER(TRIM(name)));

-- QUERY UNTUK CEK DUPLIKAT:
-- SELECT LOWER(TRIM(name)) as normalized_name, COUNT(*) as jumlah, 
--        array_agg(id) as ids, array_agg(name) as names
-- FROM public.categories 
-- GROUP BY LOWER(TRIM(name)) 
-- HAVING COUNT(*) > 1;
