-- ============================================
-- MIGRATION: Enable RLS + Policies untuk categories
-- ============================================
-- Run ini di Supabase Dashboard → SQL Editor
-- Fix error "gagal menyimpan kategori"
-- ============================================

-- Enable RLS untuk categories (kalau belum)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: semua user yang login bisa lihat kategori
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: admin bisa tambah/edit/hapus kategori
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Cek hasil
-- ============================================
-- Jalankan query ini untuk verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'categories';
-- SELECT * FROM pg_policies WHERE tablename = 'categories';
