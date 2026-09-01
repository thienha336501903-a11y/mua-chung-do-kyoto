import { formatDateTimeVietnam } from '../src/lib/utils.ts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://crphwjizolsgghapyjjv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycGh3aml6b2xzZ2doYXB5amp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIwMDUxMSwiZXhwIjoyMDk3Nzc2NTExfQ.9sTEHEL96z4liyV1skAeH2anbkkElIWo4VK9_qs_8QE'
);

async function testTimezone() {
  console.log('=== TEST KIỂM TRA MÚI GIỜ HIỂN THỊ ADMIN & CSV ===');

  // Lấy 3 bản ghi đầu tiên
  const { data, error } = await supabase
    .from('resident_demands')
    .select('id, zalo_name, apartment_number, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach((r, i) => {
    const formatted = formatDateTimeVietnam(r.created_at);
    console.log(`[Bản ghi ${i + 1}] ${r.zalo_name} (${r.apartment_number}):`);
    console.log(`  Raw UTC in DB: ${r.created_at}`);
    console.log(`  Hiển thị Admin (Asia/Ho_Chi_Minh): ${formatted}`);
  });
}

testTimezone();
