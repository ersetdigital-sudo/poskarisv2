-- ============================================
-- Migration: Snapshot modal sparepart servis + simpan stok ATOMIK
-- Jalankan di Supabase SQL Editor (sebelum deploy frontend)
-- ============================================

-- 1. Kolom snapshot HARGA BELI saat sparepart dipakai (dipakai utk hitung modal/laba)
ALTER TABLE public.service_parts
ADD COLUMN IF NOT EXISTS buy_price BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.service_parts.buy_price IS 'Harga beli saat sparepart dipakai (snapshot modal)';

-- 2. RPC: simpan seluruh set sparepart servis secara atomik (row lock + validasi stok)
--    Pemakaian:
--    - Servis BARU : kirim items final (belum ada parts lama)
--    - EDIT servis : kirim items final, fungsi hitung selisih (restore/kurangi stok otomatis)
--    - HAPUS + restore stok : kirim p_items = '[]'
CREATE OR REPLACE FUNCTION public.save_service_parts(
  p_service_id uuid,
  p_items jsonb,
  p_created_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_price bigint;
  v_buy_price bigint;
  v_old_qty integer;
  v_delta integer;
  v_stok integer;
  v_name text;
  old_part RECORD;
  new_parts uuid[] := '{}';
BEGIN
  -- Kunci semua produk lama (masih terpakai servis ini)
  FOR old_part IN SELECT product_id FROM public.service_parts WHERE service_id = p_service_id
  LOOP
    PERFORM 1 FROM public.products WHERE id = old_part.product_id FOR UPDATE;
  END LOOP;

  -- Validasi & kunci produk baru (qty > 0 saja)
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty := (item->>'quantity')::integer;
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'product_id tidak valid pada salah satu item';
    END IF;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;
    SELECT quantity, name INTO v_stok, v_name FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF v_stok IS NULL THEN
      RAISE EXCEPTION 'Produk tidak ditemukan';
    END IF;
    new_parts := array_append(new_parts, v_product_id);
  END LOOP;

  -- Selisih untuk produk yang masih ada di daftar baru
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty := (item->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;
    v_price := (item->>'price')::numeric::bigint;
    v_buy_price := COALESCE((item->>'buy_price')::numeric::bigint, 0);

    SELECT quantity, name INTO v_stok, v_name FROM public.products WHERE id = v_product_id;
    SELECT COALESCE(SUM(quantity), 0) INTO v_old_qty
    FROM public.service_parts WHERE service_id = p_service_id AND product_id = v_product_id;

    v_delta := v_qty - v_old_qty;

    IF v_delta > 0 THEN
      IF v_stok < v_delta THEN
        RAISE EXCEPTION 'Stok % tidak mencukupi (tersedia %, butuh tambahan %)', v_name, v_stok, v_delta;
      END IF;
      INSERT INTO public.stock_movements (product_id, type, quantity, reference_type, reference_id, notes, created_by)
      VALUES (v_product_id, 'keluar', v_delta, 'servis', p_service_id, 'Sparepart dipakai untuk servis', p_created_by);
    ELSIF v_delta < 0 THEN
      INSERT INTO public.stock_movements (product_id, type, quantity, reference_type, reference_id, notes, created_by)
      VALUES (v_product_id, 'masuk', -v_delta, 'servis', p_service_id, 'Restore stok (sparepart dikurangi dari servis)', p_created_by);
    END IF;
  END LOOP;

  -- Produk lama yang dihapus total dari servis -> restore penuh
  FOR old_part IN SELECT product_id, quantity FROM public.service_parts WHERE service_id = p_service_id
  LOOP
    IF NOT (old_part.product_id = ANY (new_parts)) THEN
      INSERT INTO public.stock_movements (product_id, type, quantity, reference_type, reference_id, notes, created_by)
      VALUES (old_part.product_id, 'masuk', old_part.quantity, 'servis', p_service_id, 'Restore stok (sparepart dihapus dari servis)', p_created_by);
    END IF;
  END LOOP;

  -- Ganti seluruh baris service_parts dengan set final
  DELETE FROM public.service_parts WHERE service_id = p_service_id;
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty := (item->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;
    v_price := (item->>'price')::numeric::bigint;
    v_buy_price := COALESCE((item->>'buy_price')::numeric::bigint, 0);
    INSERT INTO public.service_parts (service_id, product_id, quantity, price, buy_price)
    VALUES (p_service_id, v_product_id, v_qty, v_price, v_buy_price);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_service_parts(uuid, jsonb, uuid) TO authenticated;
