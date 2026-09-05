-- =========================================================================
-- BẢNG LƯU TRỮ KHẢO SÁT NHU CẦU MUA SẮM CƯ DÂN KYOTO
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.resident_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zalo_name TEXT NOT NULL,
    apartment_number TEXT NOT NULL,
    phone_number TEXT,
    tv_qty INTEGER NOT NULL DEFAULT 0 CHECK (tv_qty >= 0 AND tv_qty <= 10),
    sofa_qty INTEGER NOT NULL DEFAULT 0 CHECK (sofa_qty >= 0 AND sofa_qty <= 10),
    curtain_qty INTEGER NOT NULL DEFAULT 0 CHECK (curtain_qty >= 0 AND curtain_qty <= 10),
    drying_rack_qty INTEGER NOT NULL DEFAULT 0 CHECK (drying_rack_qty >= 0 AND drying_rack_qty <= 10),
    bed_qty INTEGER NOT NULL DEFAULT 0 CHECK (bed_qty >= 0 AND bed_qty <= 10),
    dining_table_set_qty INTEGER NOT NULL DEFAULT 0 CHECK (dining_table_set_qty >= 0 AND dining_table_set_qty <= 10),
    refrigerator_qty INTEGER NOT NULL DEFAULT 0 CHECK (refrigerator_qty >= 0 AND refrigerator_qty <= 10),
    washing_machine_qty INTEGER NOT NULL DEFAULT 0 CHECK (washing_machine_qty >= 0 AND washing_machine_qty <= 10),
    dryer_qty INTEGER NOT NULL DEFAULT 0 CHECK (dryer_qty >= 0 AND dryer_qty <= 10),
    dishwasher_qty INTEGER NOT NULL DEFAULT 0 CHECK (dishwasher_qty >= 0 AND dishwasher_qty <= 10),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index chống trùng lặp theo số căn hộ (chuẩn hóa chữ in hoa và cắt khoảng trắng)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_resident_apartment 
ON public.resident_demands (upper(trim(apartment_number)));

-- Index hỗ trợ tìm kiếm Admin và sắp xếp
CREATE INDEX IF NOT EXISTS idx_resident_demands_zalo ON public.resident_demands (lower(trim(zalo_name)));
CREATE INDEX IF NOT EXISTS idx_resident_demands_phone ON public.resident_demands (lower(trim(phone_number)));
CREATE INDEX IF NOT EXISTS idx_resident_demands_created ON public.resident_demands (created_at DESC);

-- Kích hoạt Row Level Security (RLS) để bảo vệ tuyệt đối dữ liệu riêng tư
ALTER TABLE public.resident_demands ENABLE ROW LEVEL SECURITY;

-- Service Role (dành cho Next.js Backend) có toàn quyền
CREATE POLICY "Service role full access on resident_demands"
ON public.resident_demands
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =========================================================================
-- MODULE: NHÀ PHÂN PHỐI / ĐẠI LÝ CHÀO GIÁ TỐT (SUPPLIER TENDER MODULE)
-- =========================================================================

-- 1. Bảng Đợt Mời Chào Giá (Tender Round / Campaign)
CREATE TABLE IF NOT EXISTS public.supplier_tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Bảng Danh Sách Model / Quy Cách Admin Mời Chào Giá
CREATE TABLE IF NOT EXISTS public.supplier_tender_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES public.supplier_tenders(id) ON DELETE CASCADE,
    category_key TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_code TEXT NOT NULL,
    product_name TEXT,
    item_type TEXT NOT NULL DEFAULT 'PRODUCT_MODEL' CHECK (item_type IN ('PRODUCT_MODEL', 'SERVICE_SPEC')),
    unit TEXT NOT NULL DEFAULT 'bộ',
    reference_qty INTEGER NOT NULL DEFAULT 1 CHECK (reference_qty >= 0),
    specifications TEXT,
    spec_definition JSONB DEFAULT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tender_brand_model UNIQUE (tender_id, category_key, brand, model_code)
);

-- 3. Bảng Hồ Sơ Lượt Gửi Báo Giá Của Nhà Cung Cấp
CREATE TABLE IF NOT EXISTS public.supplier_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES public.supplier_tenders(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address_region TEXT,
    general_note TEXT,
    is_shortlisted BOOLEAN NOT NULL DEFAULT false,
    is_selected_for_contact BOOLEAN NOT NULL DEFAULT false,
    admin_private_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bảng Báo Giá Chi Tiết Từng Model, Phương Án & Model Thay Thế
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.supplier_submissions(id) ON DELETE CASCADE,
    tender_item_id UUID REFERENCES public.supplier_tender_items(id) ON DELETE SET NULL,
    is_alternative BOOLEAN NOT NULL DEFAULT false,
    target_item_id UUID REFERENCES public.supplier_tender_items(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL DEFAULT 'PRODUCT_MODEL' CHECK (item_type IN ('PRODUCT_MODEL', 'SERVICE_SPEC')),
    category_key TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_code TEXT NOT NULL,
    product_name TEXT,
    plan_name TEXT,
    unit TEXT DEFAULT 'bộ',
    pricing_mode TEXT DEFAULT 'direct' CHECK (pricing_mode IN ('direct', 'catalog_discount')),
    list_price NUMERIC(15, 0),
    discount_percent NUMERIC(5, 2),
    effective_price NUMERIC(15, 0),
    unit_price NUMERIC(15, 0) NOT NULL CHECK (unit_price > 0),
    stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'pre_order', 'out_of_stock')),
    available_qty INTEGER NOT NULL DEFAULT 1 CHECK (available_qty >= 0),
    is_vat_included BOOLEAN NOT NULL DEFAULT false,
    is_shipping_included BOOLEAN NOT NULL DEFAULT false,
    is_installation_included BOOLEAN NOT NULL DEFAULT false,
    is_materials_included BOOLEAN NOT NULL DEFAULT true,
    is_survey_included BOOLEAN DEFAULT true,
    min_order_value NUMERIC(15, 0),
    warranty_months INTEGER,
    lead_time_days INTEGER,
    fabric_main TEXT,
    fabric_sheer TEXT,
    material TEXT,
    wire_spec TEXT,
    wire_diameter_mm NUMERIC(4, 1),
    wire_spacing_cm NUMERIC(4, 1),
    frame_spec TEXT,
    load_capacity_kg NUMERIC(6, 1),
    drying_bars_count INTEGER,
    catalog_url TEXT,
    catalog_code TEXT,
    tier_pricing JSONB,
    proposal_reason TEXT,
    quote_note TEXT,
    is_shortlisted BOOLEAN NOT NULL DEFAULT false,
    is_selected_for_contact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes tối ưu hiệu năng
CREATE INDEX IF NOT EXISTS idx_tender_items_tender ON public.supplier_tender_items(tender_id, category_key);
CREATE INDEX IF NOT EXISTS idx_tender_items_type ON public.supplier_tender_items(tender_id, item_type);
CREATE INDEX IF NOT EXISTS idx_tender_items_order ON public.supplier_tender_items(display_order);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_sub ON public.supplier_quotes(submission_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_item ON public.supplier_quotes(tender_item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_price ON public.supplier_quotes(tender_item_id, unit_price);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_eff_price ON public.supplier_quotes(tender_item_id, unit, effective_price);
