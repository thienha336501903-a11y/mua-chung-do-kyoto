-- Thêm cột dining_table_set_qty vào bảng resident_demands (an toàn tuyệt đối với dữ liệu cũ)
ALTER TABLE public.resident_demands 
ADD COLUMN IF NOT EXISTS dining_table_set_qty INTEGER NOT NULL DEFAULT 0 CHECK (dining_table_set_qty >= 0 AND dining_table_set_qty <= 10);
