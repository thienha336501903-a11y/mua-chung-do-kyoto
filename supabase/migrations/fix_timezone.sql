-- 1. Chuyển default về now() (chuẩn UTC timestamptz trong PostgreSQL)
ALTER TABLE public.resident_demands 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Chuẩn hóa lại các bản ghi cũ bị lệch +7 giờ do DEFAULT timezone() trước đây
UPDATE public.resident_demands 
SET created_at = created_at - interval '7 hours'
WHERE created_at > updated_at + interval '5 hours';
