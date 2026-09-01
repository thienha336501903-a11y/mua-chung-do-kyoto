-- Thêm trường phone_number vào bảng resident_demands một cách an toàn (không làm ảnh hưởng dữ liệu cũ)
ALTER TABLE public.resident_demands 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Tạo index hỗ trợ tìm kiếm số điện thoại cho Admin
CREATE INDEX IF NOT EXISTS idx_resident_demands_phone 
ON public.resident_demands (lower(trim(phone_number)));
