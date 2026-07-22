-- Migration: Tambah kolom email ke tabel profiles & INSERT policy
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Tambah INSERT policy supaya admin bisa buat user baru
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
