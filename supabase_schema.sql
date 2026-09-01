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
    refrigerator_qty INTEGER NOT NULL DEFAULT 0 CHECK (refrigerator_qty >= 0 AND refrigerator_qty <= 10),
    washing_machine_qty INTEGER NOT NULL DEFAULT 0 CHECK (washing_machine_qty >= 0 AND washing_machine_qty <= 10),
    dryer_qty INTEGER NOT NULL DEFAULT 0 CHECK (dryer_qty >= 0 AND dryer_qty <= 10),
    dishwasher_qty INTEGER NOT NULL DEFAULT 0 CHECK (dishwasher_qty >= 0 AND dishwasher_qty <= 10),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Ho_Chi_Minh', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Ho_Chi_Minh', now())
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

-- Xóa các policy cũ nếu có
DROP POLICY IF EXISTS "Public cannot read resident_demands" ON public.resident_demands;
DROP POLICY IF EXISTS "Service role full access on resident_demands" ON public.resident_demands;

-- Service Role (dành cho Next.js Backend) có toàn quyền
CREATE POLICY "Service role full access on resident_demands"
ON public.resident_demands
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =========================================================================
-- DATABASE FUNCTION: get_demand_summary()
-- Tổng hợp số liệu thống kê công khai một cách an toàn mà không tiết lộ số căn
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_demand_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_households', COUNT(*),
        'tv', jsonb_build_object(
            'total_qty', COALESCE(SUM(tv_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE tv_qty > 0)
        ),
        'sofa', jsonb_build_object(
            'total_qty', COALESCE(SUM(sofa_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE sofa_qty > 0)
        ),
        'curtain', jsonb_build_object(
            'total_qty', COALESCE(SUM(curtain_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE curtain_qty > 0)
        ),
        'drying_rack', jsonb_build_object(
            'total_qty', COALESCE(SUM(drying_rack_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE drying_rack_qty > 0)
        ),
        'bed', jsonb_build_object(
            'total_qty', COALESCE(SUM(bed_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE bed_qty > 0)
        ),
        'refrigerator', jsonb_build_object(
            'total_qty', COALESCE(SUM(refrigerator_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE refrigerator_qty > 0)
        ),
        'washing_machine', jsonb_build_object(
            'total_qty', COALESCE(SUM(washing_machine_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE washing_machine_qty > 0)
        ),
        'dryer', jsonb_build_object(
            'total_qty', COALESCE(SUM(dryer_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE dryer_qty > 0)
        ),
        'dishwasher', jsonb_build_object(
            'total_qty', COALESCE(SUM(dishwasher_qty), 0),
            'households_count', COUNT(*) FILTER (WHERE dishwasher_qty > 0)
        ),
        'updated_at', timezone('Asia/Ho_Chi_Minh', now())
    )
    INTO result
    FROM public.resident_demands;

    RETURN result;
END;
$$;
