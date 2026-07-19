-- Migration: Support sparepart sales + invoice number prefixes
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom tipe_barang ke sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'unit' CHECK (item_type IN ('unit', 'sparepart'));

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS item_name TEXT;

COMMENT ON COLUMN public.sales.item_type IS 'Tipe barang: unit atau sparepart';
COMMENT ON COLUMN public.sales.quantity IS 'Jumlah barang yang dijual (untuk sparepart)';
COMMENT ON COLUMN public.sales.item_name IS 'Nama barang (denormalized untuk riwayat)';

-- 2. Update sequence untuk invoice number
-- Buat sequence terpisah untuk sparepart
CREATE SEQUENCE IF NOT EXISTS invoice_sparepart_seq START 1;

-- 3. Update function generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'sparepart' THEN
    NEW.invoice_number := 'JSP-' || LPAD(nextval('invoice_sparepart_seq')::TEXT, 4, '0');
  ELSE
    NEW.invoice_number := 'JUL-' || LPAD(nextval('invoice_sales_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_sales_item_type ON public.sales(item_type);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
