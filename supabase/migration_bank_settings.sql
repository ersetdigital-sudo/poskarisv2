-- Migration: Tambah pengaturan rekening bank
-- Jalankan di Supabase SQL Editor

-- Insert default values (will be updated by user via settings page)
INSERT INTO public.settings (key, value) VALUES
  ('bank_name', 'BCA'),
  ('bank_account_number', ''),
  ('bank_account_holder', '')
ON CONFLICT (key) DO NOTHING;
