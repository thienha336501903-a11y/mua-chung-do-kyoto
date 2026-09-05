-- ================================================================
-- MIGRATION: BỔ SUNG HỖ TRỢ DỊCH VỤ THI CÔNG / QUY CÁCH (SERVICE_SPEC)
-- VÀ ĐỢT MỜI CHÀO GIÁ #02 (RÈM CỬA • LƯỚI AN TOÀN • GIÀN PHƠI)
-- HOÀN TOÀN ADDITIVE - BẢO TOÀN 100% DỮ LIỆU ĐỢT #01 VÀ CƯ DÂN
-- ================================================================

-- 1. Bổ sung các cột cho bảng supplier_tender_items
ALTER TABLE public.supplier_tender_items 
ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'PRODUCT_MODEL',
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'bộ',
ADD COLUMN IF NOT EXISTS spec_definition JSONB DEFAULT NULL;

-- 2. Bổ sung các cột cho bảng supplier_quotes
ALTER TABLE public.supplier_quotes 
ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'PRODUCT_MODEL',
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'bộ',
ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS list_price NUMERIC(15, 0) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS effective_price NUMERIC(15, 0) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fabric_main TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fabric_sheer TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS material TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS wire_spec TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS wire_diameter_mm NUMERIC(4, 1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS wire_spacing_cm NUMERIC(4, 1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS frame_spec TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS load_capacity_kg NUMERIC(6, 1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS drying_bars_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS catalog_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS catalog_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_materials_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_survey_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(15, 0) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier_pricing JSONB DEFAULT NULL;

-- 3. Tạo index hỗ trợ tìm kiếm và so sánh giá theo item_type và unit
CREATE INDEX IF NOT EXISTS idx_tender_items_type ON public.supplier_tender_items(tender_id, item_type);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_eff_price ON public.supplier_quotes(tender_item_id, unit, effective_price);
