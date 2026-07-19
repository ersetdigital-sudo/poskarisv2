-- Migration: Tabel metode pembayaran + update sales
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment methods" ON public.payment_methods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage payment methods" ON public.payment_methods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default payment methods
INSERT INTO public.payment_methods (name, description, sort_order) VALUES
  ('Cash', 'Pembayaran tunai', 1),
  ('Transfer BCA', 'Transfer ke rekening BCA', 2),
  ('QRIS', 'Pembayaran via QRIS', 3)
ON CONFLICT (name) DO NOTHING;

-- 2. Tambah kolom garansi ke tabel sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS garansi TEXT DEFAULT 'Tanpa Garansi';

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS warranty_end_date TIMESTAMPTZ;

COMMENT ON COLUMN public.sales.garansi IS 'Durasi garansi unit';
COMMENT ON COLUMN public.sales.warranty_end_date IS 'Tanggal berakhir garansi';

-- 3. Update payment_method constraint (hapus constraint lama jika ada)
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Tambah constraint baru yang lebih fleksibel
ALTER TABLE public.sales 
ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method IS NOT NULL AND length(payment_method) > 0);
