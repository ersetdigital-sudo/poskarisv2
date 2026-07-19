-- Migration: Tambah status 'menunggu' ke tabel services
-- Jalankan di Supabase SQL Editor

-- Update constraint untuk status
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_status_check;

ALTER TABLE public.services 
ADD CONSTRAINT services_status_check 
CHECK (status IN ('proses', 'menunggu', 'selesai', 'dibatalkan'));

COMMENT ON COLUMN public.services.status IS 'Status servis: proses, menunggu (konfirmasi customer), selesai, dibatalkan';
