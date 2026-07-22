-- Migration: Tabel sale_items untuk multi-item per nota
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel sale_items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('unit', 'sparepart')),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  buy_price BIGINT NOT NULL DEFAULT 0,
  sell_price BIGINT NOT NULL DEFAULT 0,
  subtotal BIGINT GENERATED ALWAYS AS (quantity * sell_price) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Index untuk performa
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items (product_id);

-- 5. Tambah kolom is_multi_item di sales (opsional, untuk flag)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_multi_item BOOLEAN DEFAULT false;
