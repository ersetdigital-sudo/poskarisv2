-- Migration: Sync status produk dengan quantity
-- Jalankan di Supabase SQL Editor untuk memperbaiki data yang sudah ada

-- Update status berdasarkan quantity
UPDATE public.products 
SET status = CASE 
  WHEN quantity > 0 THEN 'ready'
  WHEN quantity = 0 THEN 'sold'
  ELSE status
END
WHERE status != 'sold' OR (status = 'sold' AND quantity > 0);

-- Verifikasi: cek produk yang statusnya tidak konsisten
-- SELECT id, name, quantity, status, 
--   CASE WHEN quantity > 0 THEN 'ready' ELSE 'sold' END as correct_status
-- FROM public.products 
-- WHERE status != (CASE WHEN quantity > 0 THEN 'ready' ELSE 'sold' END);
