-- ================================================================
-- MIGRATION: BỔ SUNG MODULE NHÀ PHÂN PHỐI / ĐẠI LÝ CHÀO GIÁ TỐT
-- BẢO TOÀN 100% DỮ LIỆU CƯ DÂN TRÊN BẢNG resident_demands (ADDITIVE ONLY)
-- ================================================================

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

-- 2. Bảng Danh Sách Model Admin Mời Chào Giá
CREATE TABLE IF NOT EXISTS public.supplier_tender_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES public.supplier_tenders(id) ON DELETE CASCADE,
    category_key TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_code TEXT NOT NULL,
    product_name TEXT,
    reference_qty INTEGER NOT NULL DEFAULT 1 CHECK (reference_qty >= 0),
    specifications TEXT,
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

-- 4. Bảng Báo Giá Chi Tiết Từng Model & Model Thay Thế
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.supplier_submissions(id) ON DELETE CASCADE,
    tender_item_id UUID REFERENCES public.supplier_tender_items(id) ON DELETE SET NULL,
    is_alternative BOOLEAN NOT NULL DEFAULT false,
    target_item_id UUID REFERENCES public.supplier_tender_items(id) ON DELETE SET NULL,
    category_key TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_code TEXT NOT NULL,
    product_name TEXT,
    unit_price NUMERIC(15, 0) NOT NULL CHECK (unit_price > 0),
    stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'pre_order', 'out_of_stock')),
    available_qty INTEGER NOT NULL DEFAULT 1 CHECK (available_qty >= 0),
    is_vat_included BOOLEAN NOT NULL DEFAULT false,
    is_shipping_included BOOLEAN NOT NULL DEFAULT false,
    is_installation_included BOOLEAN NOT NULL DEFAULT false,
    warranty_months INTEGER,
    lead_time_days INTEGER,
    proposal_reason TEXT,
    quote_note TEXT,
    is_shortlisted BOOLEAN NOT NULL DEFAULT false,
    is_selected_for_contact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes tối ưu hiệu năng
CREATE INDEX IF NOT EXISTS idx_tender_items_tender ON public.supplier_tender_items(tender_id, category_key);
CREATE INDEX IF NOT EXISTS idx_tender_items_order ON public.supplier_tender_items(display_order);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_sub ON public.supplier_quotes(submission_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_item ON public.supplier_quotes(tender_item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_price ON public.supplier_quotes(tender_item_id, unit_price);
