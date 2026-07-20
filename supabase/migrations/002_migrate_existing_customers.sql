-- Migration: Create customers from existing sales/services data
-- Run this AFTER running 001_create_customers.sql

-- 1. Insert customers from sales data (buyer_name + buyer_phone)
INSERT INTO customers (nama, no_wa)
SELECT DISTINCT ON (buyer_phone)
  buyer_name AS nama,
  buyer_phone AS no_wa
FROM sales
WHERE buyer_phone IS NOT NULL
  AND buyer_phone != ''
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE no_wa = sales.buyer_phone
  )
ORDER BY buyer_phone, created_at DESC;

-- 2. Insert customers from services data (customer_name + customer_phone)
INSERT INTO customers (nama, no_wa)
SELECT DISTINCT ON (customer_phone)
  customer_name AS nama,
  customer_phone AS no_wa
FROM services
WHERE customer_phone IS NOT NULL
  AND customer_phone != ''
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE no_wa = services.customer_phone
  )
ORDER BY customer_phone, created_at DESC;

-- 3. Update sales.customer_id based on buyer_phone match
UPDATE sales
SET customer_id = customers.id
FROM customers
WHERE sales.buyer_phone = customers.no_wa
  AND sales.customer_id IS NULL;

-- 4. Update services.customer_id based on customer_phone match
UPDATE services
SET customer_id = customers.id
FROM customers
WHERE services.customer_phone = customers.no_wa
  AND services.customer_id IS NULL;
