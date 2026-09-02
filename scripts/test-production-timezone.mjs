const BASE_URL = 'https://mua-chung-do-kyoto.vercel.app';
const ADMIN_PASSWORD = 'kyoto2026@admin';

async function runTimezoneProductionTest() {
  console.log('====================================================');
  console.log('KIỂM THỬ MÚI GIỜ ASIA/HO_CHI_MINH TRÊN PRODUCTION');
  console.log('Target URL:', BASE_URL);
  console.log('====================================================\n');

  // Ghi nhận thời gian hiện tại của máy (UTC+7)
  const nowVN = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(new Date());

  console.log(`[1] Thời gian thực tế gửi form (Asia/Ho_Chi_Minh): ${nowVN}`);

  // Submit test record
  const submitRes = await fetch(`${BASE_URL}/api/demands/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      zalo_name: '__TEST_TIMEZONE_KYOTO__ Test User',
      apartment_number: '__TEST_TIMEZONE_01__',
      phone_number: '0912345678',
      dining_table_set_qty: 1,
    }),
  });

  const submitJson = await submitRes.json();
  console.log(`[2] Submit status: ${submitRes.status}, success: ${submitJson.success}`);

  // Admin login
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.token;

  // Fetch admin demands
  const adminRes = await fetch(`${BASE_URL}/api/admin/demands`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminJson = await adminRes.json();
  const records = adminJson.data || [];

  console.log(`\n[3] Kiểm tra hiển thị trong danh sách Admin (${records.length} bản ghi):`);

  function formatVN(dateStr) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).format(new Date(dateStr));
  }

  // Check top 3 records
  records.slice(0, 4).forEach((r, i) => {
    const formatted = formatVN(r.created_at);
    console.log(`  Bản ghi ${i + 1}: ${r.zalo_name} (${r.apartment_number})`);
    console.log(`    Raw created_at (UTC): ${r.created_at}`);
    console.log(`    Hiển thị Admin:       ${formatted}`);
  });

  const testRecord = records.find(r => r.apartment_number === '__TEST_TIMEZONE_01__');
  if (testRecord) {
    const testFormatted = formatVN(testRecord.created_at);
    console.log(`\n[4] So sánh bản ghi Test:`);
    console.log(`  Giờ gửi thực tế: ${nowVN}`);
    console.log(`  Giờ trên Admin:  ${testFormatted}`);
    const isMatching = testFormatted.slice(0, 14) === nowVN.slice(0, 14); // So sánh ngày và giờ:phút
    console.log(`  => KẾT QUẢ KHỚP GIỜ: ${isMatching ? 'CHÍNH XÁC (PASS)' : 'LỆCH GIỜ (FAIL)'}`);
  }

  // Cleanup
  console.log('\n[5] Dọn dẹp dữ liệu test...');
  const cleanRes = await fetch(`${BASE_URL}/api/admin/demands?cleanup_test=true`, {
    method: 'DELETE',
    headers: { 'x-admin-password': ADMIN_PASSWORD },
  });
  const cleanJson = await cleanRes.json();
  console.log(`  Đã xóa ${cleanJson.deletedCount} bản ghi test. Dữ liệu thật được bảo toàn.`);
}

runTimezoneProductionTest();
