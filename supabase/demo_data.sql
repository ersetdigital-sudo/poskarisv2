-- ============================================
-- DATA DEMO KASIR POS LAPTOP
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Pastikan kategori ada
INSERT INTO categories (name, description) 
VALUES 
  ('Sparepart', 'Komponen dan aksesoris laptop'),
  ('Unit Laptop', 'Laptop bekas dan baru untuk dijual')
ON CONFLICT DO NOTHING;

-- 2. Ambil ID kategori
DO $$
DECLARE
  sparepart_cat_id UUID;
  unit_cat_id UUID;
  v_service_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO sparepart_cat_id FROM categories WHERE name = 'Sparepart' LIMIT 1;
  SELECT id INTO unit_cat_id FROM categories WHERE name = 'Unit Laptop' LIMIT 1;

  -- ============================================
  -- DATA PRODUK (SPAREPART)
  -- ============================================
  INSERT INTO products (category_id, name, sku, brand, condition, buy_price, sell_price, quantity, min_quantity, status)
  VALUES
    (sparepart_cat_id, 'RAM 8GB DDR4 SODIMM', 'SP-001', 'Kingston', 'baru', 150000, 250000, 15, 5, 'ready'),
    (sparepart_cat_id, 'RAM 4GB DDR4 SODIMM', 'SP-002', 'V-Gen', 'baru', 80000, 150000, 20, 5, 'ready'),
    (sparepart_cat_id, 'SSD 256GB NVMe', 'SP-003', 'WD Green', 'baru', 250000, 400000, 10, 3, 'ready'),
    (sparepart_cat_id, 'SSD 512GB SATA', 'SP-004', 'Samsung', 'baru', 400000, 600000, 8, 3, 'ready'),
    (sparepart_cat_id, 'Charger Laptop 65W', 'SP-005', 'Universal', 'baru', 75000, 150000, 12, 5, 'ready'),
    (sparepart_cat_id, 'Keyboard Laptop Asus', 'SP-006', 'Asus', 'baru', 120000, 200000, 6, 3, 'ready'),
    (sparepart_cat_id, 'Keyboard Laptop Lenovo', 'SP-007', 'Lenovo', 'baru', 130000, 220000, 4, 3, 'ready'),
    (sparepart_cat_id, 'LCD Laptop 14 inch', 'SP-008', 'AUO', 'baru', 500000, 800000, 3, 2, 'ready'),
    (sparepart_cat_id, 'Baterai Laptop Asus', 'SP-009', 'Asus', 'baru', 200000, 350000, 5, 2, 'ready'),
    (sparepart_cat_id, 'Thermal Paste', 'SP-010', 'Arctic MX-4', 'baru', 25000, 50000, 30, 10, 'ready'),
    (sparepart_cat_id, 'HDD 1TB 2.5inch', 'SP-011', 'Seagate', 'bekas', 150000, 250000, 7, 3, 'ready'),
    (sparepart_cat_id, 'WiFi Adapter USB', 'SP-012', 'TP-Link', 'baru', 50000, 100000, 10, 5, 'ready');

  -- ============================================
  -- DATA PRODUK (UNIT LAPTOP)
  -- ============================================
  INSERT INTO products (category_id, name, sku, brand, model, specs, condition, buy_price, sell_price, quantity, min_quantity, status)
  VALUES
    (unit_cat_id, 'Asus VivoBook 14', 'UL-001', 'Asus', 'VivoBook 14 A416', 'i3-1115G4, 8GB, 256GB SSD', 'bekas', 4500000, 5500000, 1, 0, 'ready'),
    (unit_cat_id, 'Lenovo IdeaPad Slim 3', 'UL-002', 'Lenovo', 'IdeaPad Slim 3', 'i5-1235U, 8GB, 512GB SSD', 'bekas', 5800000, 7200000, 1, 0, 'ready'),
    (unit_cat_id, 'HP 245 G8', 'UL-003', 'HP', '245 G8', 'Ryzen 3 3250U, 4GB, 256GB SSD', 'bekas', 3200000, 4200000, 1, 0, 'ready'),
    (unit_cat_id, 'Acer Aspire 5', 'UL-004', 'Acer', 'Aspire 5 A514', 'i5-1135G7, 8GB, 512GB SSD', 'bekas', 5200000, 6500000, 1, 0, 'ready'),
    (unit_cat_id, 'Dell Latitude 3420', 'UL-005', 'Dell', 'Latitude 3420', 'i3-1115G4, 8GB, 256GB SSD', 'bekas', 4800000, 5900000, 1, 0, 'ready'),
    (unit_cat_id, 'Asus ROG Strix G15', 'UL-006', 'Asus', 'ROG Strix G15', 'Ryzen 5 5600H, 16GB, 512GB SSD, RTX 3050', 'bekas', 9500000, 12500000, 1, 0, 'ready'),
    (unit_cat_id, 'MacBook Air M1', 'UL-007', 'Apple', 'MacBook Air M1', 'M1, 8GB, 256GB SSD', 'bekas', 10000000, 13000000, 1, 0, 'ready'),
    (unit_cat_id, 'Lenovo ThinkPad T480', 'UL-008', 'Lenovo', 'ThinkPad T480', 'i5-8250U, 8GB, 256GB SSD', 'bekas', 4000000, 5200000, 1, 0, 'ready');

  -- ============================================
  -- DATA SERVIS (Juli 2026)
  -- ============================================
  INSERT INTO services (nota_number, customer_name, customer_phone, device_type, device_brand, device_model, complaint, service_fee, parts_fee, total_fee, dp_amount, status, date_in, date_out)
  VALUES
    ('SRV-0001', 'Andri Pratama', '081234567890', 'Laptop', 'Asus', 'VivoBook 14', 'Mati total, tidak bisa nyala', 150000, 0, 150000, 50000, 'selesai', '2026-07-01 09:00:00', '2026-07-03 14:00:00'),
    ('SRV-0002', 'Budi Santoso', '085678901234', 'Laptop', 'Lenovo', 'IdeaPad 3', 'Layar berkedip-kedip', 200000, 800000, 1000000, 0, 'selesai', '2026-07-02 10:30:00', '2026-07-04 16:00:00'),
    ('SRV-0003', 'Citra Dewi', '087890123456', 'Laptop', 'HP', 'Pavilion 15', 'Keyboard rusak beberapa tombol', 100000, 200000, 300000, 100000, 'selesai', '2026-07-03 08:00:00', '2026-07-05 11:00:00'),
    ('SRV-0004', 'Dedi Kurniawan', '081290123456', 'Laptop', 'Acer', 'Aspire 5', 'Lemot, sering hang', 100000, 400000, 500000, 0, 'selesai', '2026-07-04 13:00:00', '2026-07-06 15:00:00'),
    ('SRV-0005', 'Eka Putri', '085212345678', 'Laptop', 'Dell', 'Inspiron 14', 'Baterai cepat habis', 75000, 350000, 425000, 0, 'selesai', '2026-07-05 09:30:00', '2026-07-07 10:00:00'),
    ('SRV-0006', 'Fajar Nugroho', '087812345678', 'PC', 'Custom', 'Desktop', 'Upgrade RAM dan SSD', 100000, 650000, 750000, 250000, 'selesai', '2026-07-07 14:00:00', '2026-07-08 16:00:00'),
    ('SRV-0007', 'Gita Sari', '081234560001', 'Laptop', 'Asus', 'ROG Strix', 'Overheating, mati sendiri', 200000, 50000, 250000, 0, 'selesai', '2026-07-08 10:00:00', '2026-07-10 12:00:00'),
    ('SRV-0008', 'Hadi Wijaya', '085678900002', 'Laptop', 'Lenovo', 'ThinkPad T480', 'WiFi tidak bisa connect', 75000, 100000, 175000, 0, 'selesai', '2026-07-10 08:30:00', '2026-07-11 09:00:00'),
    ('SRV-0009', 'Indah Permata', '087890120003', 'Laptop', 'HP', '245 G8', 'Install ulang Windows', 75000, 0, 75000, 0, 'selesai', '2026-07-12 11:00:00', '2026-07-12 15:00:00'),
    ('SRV-0010', 'Joko Susilo', '081290120004', 'Laptop', 'Acer', 'Swift 3', 'Engsel patah', 150000, 0, 150000, 50000, 'proses', '2026-07-14 09:00:00', NULL),
    ('SRV-0011', 'Kartika Sari', '085212340005', 'Laptop', 'Asus', 'X441MA', 'LCD pecah', 100000, 800000, 900000, 300000, 'proses', '2026-07-15 10:00:00', NULL),
    ('SRV-0012', 'Lukman Hakim', '087812340006', 'Printer', 'Canon', 'G2020', 'Tinta tidak keluar', 50000, 0, 50000, 0, 'selesai', '2026-07-16 13:00:00', '2026-07-16 17:00:00'),
    ('SRV-0013', 'Maya Anggraeni', '081234560007', 'Laptop', 'Dell', 'Vostro 14', 'Charger tidak mau cas', 50000, 150000, 200000, 0, 'selesai', '2026-07-17 08:00:00', '2026-07-18 10:00:00'),
    ('SRV-0014', 'Nanda Pratama', '085678900008', 'Laptop', 'Lenovo', 'IdeaPad Slim 3', 'Upgrade RAM 8GB ke 16GB', 50000, 250000, 300000, 0, 'proses', '2026-07-18 14:00:00', NULL),
    ('SRV-0015', 'Olivia Putri', '087890120009', 'Laptop', 'Asus', 'VivoBook 15', 'Blue screen terus', 150000, 0, 150000, 0, 'selesai', '2026-07-19 09:00:00', '2026-07-20 11:00:00');

  -- ============================================
  -- DATA PENJUALAN UNIT (Juli 2026)
  -- ============================================
  INSERT INTO sales (invoice_number, product_id, buyer_name, buyer_phone, sell_price, buy_price, margin, payment_method, status, date)
  SELECT 
    'INV-000' || (ROW_NUMBER() OVER ()),
    p.id,
    buyer_name,
    buyer_phone,
    sell_price,
    buy_price,
    sell_price - buy_price,
    payment,
    'completed',
    sale_date::timestamp
  FROM (VALUES
    ('Asus VivoBook 14', 'Rina Wati', '081234511111', 5500000, 4500000, 'tunai', '2026-07-03'),
    ('HP 245 G8', 'Surya Darma', '085678922222', 4200000, 3200000, 'transfer', '2026-07-06'),
    ('Lenovo ThinkPad T480', 'Tono Sugiarto', '087890133333', 5200000, 4000000, 'tunai', '2026-07-10'),
    ('Acer Aspire 5', 'Dewi Lestari', '081290144444', 6500000, 5200000, 'transfer', '2026-07-14'),
    ('Dell Latitude 3420', 'Hendra Gunawan', '085212355555', 5900000, 4800000, 'tunai', '2026-07-17')
  ) AS s(product_name, buyer_name, buyer_phone, sell_price, buy_price, payment, sale_date)
  JOIN products p ON p.name = s.product_name AND p.category_id = unit_cat_id;

  -- Update status produk yang terjual
  UPDATE products SET status = 'sold', quantity = 0 
  WHERE name IN ('Asus VivoBook 14', 'HP 245 G8', 'Lenovo ThinkPad T480', 'Acer Aspire 5', 'Dell Latitude 3420')
    AND category_id = unit_cat_id;

  -- ============================================
  -- DATA BIAYA OPERASIONAL (Juli 2026)
  -- ============================================
  INSERT INTO operational_costs (name, amount, period_month, period_year, notes)
  VALUES
    ('Sewa Tempat', 3000000, 7, 2026, 'Sewa ruko bulanan'),
    ('Listrik', 500000, 7, 2026, 'Tagihan listrik PLN'),
    ('Internet', 350000, 7, 2026, 'IndiHome 50Mbps'),
    ('Gaji Karyawan', 2500000, 7, 2026, 'Gaji 1 karyawan'),
    ('Transport & Logistik', 200000, 7, 2026, 'Biaya pengiriman sparepart');

  -- ============================================
  -- DATA STOCK MOVEMENTS
  -- ============================================
  -- Sparepart masuk (stok awal)
  INSERT INTO stock_movements (product_id, type, quantity, reference_type, notes)
  SELECT p.id, 'masuk', p.quantity, 'adjustment', 'Stok awal ' || p.name
  FROM products p WHERE p.category_id = sparepart_cat_id;

END $$;

-- ============================================
-- SELESAI! Data demo sudah terisi.
-- ============================================
-- Total: 12 sparepart, 8 unit laptop, 15 servis, 5 penjualan, 5 biaya operasional
