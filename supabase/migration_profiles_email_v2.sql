-- Migration: Tambah kolom email ke tabel profiles (safe version)
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom email (abaikan jika sudah ada)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 2. Cek dan tambah INSERT policy jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can insert profiles'
  ) THEN
    CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
