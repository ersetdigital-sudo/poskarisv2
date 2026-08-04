-- ============================================
-- FITUR: BELI SPAREPART (pembelian = pengeluaran toko)
-- ============================================

-- 1. Tabel pembelian sparepart (expense channel, terpisah dari operational_costs)
CREATE TABLE IF NOT EXISTS public.sparepart_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  buy_price BIGINT NOT NULL,
  total BIGINT NOT NULL, -- buy_price * quantity
  source_type TEXT DEFAULT 'supplier' CHECK (source_type IN ('supplier', 'customer')),
  source_name TEXT,
  source_phone TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sparepart_purchases_date ON public.sparepart_purchases (purchase_date);
CREATE INDEX IF NOT EXISTS idx_sparepart_purchases_product ON public.sparepart_purchases (product_id);

ALTER TABLE public.sparepart_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view sparepart purchases" ON public.sparepart_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can create sparepart purchases" ON public.sparepart_purchases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete sparepart purchases" ON public.sparepart_purchases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Tambah nilai reference_type untuk mutasi stok masuk pembelian sparepart
ALTER TABLE public.stock_movements DROP CONSTRAINT stock_movements_reference_type_check;

ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_reference_type_check
  CHECK (reference_type IN ('pembelian_unit', 'penjualan_unit', 'servis', 'adjustment', 'pembelian_sparepart'));
