-- Settings table untuk menyimpan konfigurasi toko
-- Jalankan ini di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Admin bisa baca semua settings
CREATE POLICY "Admin can view settings" ON public.settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin bisa manage settings
CREATE POLICY "Admin can manage settings" ON public.settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Default values
INSERT INTO public.settings (key, value, description) VALUES
  ('store_name', 'Kasir POS', 'Nama toko yang tampil di nota dan sidebar'),
  ('store_address', 'Jl. Contoh No. 123, Kota', 'Alamat toko'),
  ('store_phone', '0812-3456-7890', 'Telepon toko'),
  ('fonnte_api_key', '', 'API Key Fonnte untuk kirim WhatsApp'),
  ('admin_phone', '', 'Nomor HP admin untuk notifikasi')
ON CONFLICT (key) DO NOTHING;
