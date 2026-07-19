-- Migration: Tambah field dp_amount, bonus ke tabel sales
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom dp_amount
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS dp_amount BIGINT DEFAULT 0;

-- 2. Tambah kolom bonus (array text untuk checkbox)
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS bonus TEXT[];

-- 3. Tambah kolom bonus_lainnya (text bebas)
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS bonus_lainnya TEXT;

COMMENT ON COLUMN public.sales.dp_amount IS 'DP/Uang Muka dalam rupiah';
COMMENT ON COLUMN public.sales.bonus IS 'Array bonus yang dipilih (Mouse, Keyboard, Tas, Mousepad)';
COMMENT ON COLUMN public.sales.bonus_lainnya IS 'Bonus lainnya (text bebas)';
