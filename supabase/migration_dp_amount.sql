-- Migration: Add dp_amount column to services table
-- Run this in Supabase SQL Editor

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS dp_amount NUMERIC DEFAULT 0;

-- Update existing records to have dp_amount = 0
UPDATE services SET dp_amount = 0 WHERE dp_amount IS NULL;
