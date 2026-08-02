-- ============================================
-- Izinkan karyawan menambah stok (products & categories)
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================

CREATE POLICY "Authenticated users can create products" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create categories" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
