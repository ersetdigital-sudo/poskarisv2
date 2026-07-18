-- Buat storage bucket untuk file nota PDF
-- Jalankan di Supabase SQL Editor

-- Buat bucket 'nota' (public access supaya Fonnte bisa download)
INSERT INTO storage.buckets (id, name, public) VALUES ('nota', 'nota', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: semua user bisa upload
CREATE POLICY "Authenticated users can upload nota" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'nota');

-- Policy: semua user bisa baca (Fonnte perlu download)
CREATE POLICY "Anyone can read nota" ON storage.objects
  FOR SELECT USING (bucket_id = 'nota');

-- Policy: semua user bisa hapus (cleanup)
CREATE POLICY "Authenticated users can delete nota" ON storage.objects
  FOR DELETE USING (bucket_id = 'nota');
