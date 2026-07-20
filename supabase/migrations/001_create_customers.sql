-- Migration: Create customers table and add customer_id FK to sales/services
-- Run this in Supabase SQL Editor

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  no_wa TEXT NOT NULL,
  alamat TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on no_wa for dedup
CREATE UNIQUE INDEX IF NOT EXISTS customers_no_wa_unique ON customers (no_wa);

-- Create index for search (using btree, works without extensions)
CREATE INDEX IF NOT EXISTS customers_nama_idx ON customers (nama);
CREATE INDEX IF NOT EXISTS customers_no_wa_idx ON customers (no_wa);

-- 2. Add customer_id column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 3. Add customer_id column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 4. Create indexes for the new FK columns
CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON sales (customer_id);
CREATE INDEX IF NOT EXISTS services_customer_id_idx ON services (customer_id);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
