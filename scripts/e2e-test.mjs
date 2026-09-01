/**
 * Kịch bản kiểm thử E2E tự động toàn diện cho dự án
 * "NHU CẦU MUA SẮM CƯ DÂN KYOTO"
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kyoto2026@admin';

const TEST_ZALO_1 = '__TEST_KYOTO_DEMAND__ Nguyen Van A';
const TEST_APT_1 = '__TEST_0001__';

async function runTests() {
  console.log('====================================================');
  console.log('BẮT ĐẦU KIỂM THỬ E2E CHO DỰ ÁN MUA SẮM CƯ DÂN KYOTO');
  console.log('Target URL:', BASE_URL);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: Kiểm tra trang chủ HTTP 200 & HTML Content
    // ----------------------------------------------------
    console.log('>>> Test 1 & 2: Kiểm tra Trang chủ và Metadata...');
    const homeRes = await fetch(BASE_URL);
    assert('Test 1.1 - Trang chủ HTTP 200', homeRes.status === 200, `(Status: ${homeRes.status})`);
    const homeHtml = await homeRes.text();
    assert(
      'Test 1.2 - Tiêu đề chứa "Nhu cầu mua sắm cư dân Kyoto"',
      homeHtml.toLowerCase().includes('nhu cầu mua sắm cư dân kyoto') ||
        homeHtml.includes('NHU C&#x1EA6;U MUA S&#x1EAF;M C&#x1AF; D&#xC2;N KYOTO')
    );
    assert(
      'Test 1.3 - Form có Tên Zalo & Số căn hộ',
      homeHtml.includes('Tên Zalo') && homeHtml.includes('Số căn')
    );
    assert(
      'Test 2.1 - Mobile First Viewport Meta',
      homeHtml.includes('width=device-width')
    );

    // ----------------------------------------------------
    // Test 3: Server Validation Check
    // ----------------------------------------------------
    console.log('\n>>> Test 3: Kiểm tra Server Validation...');
    // Thiếu tên
    const valRes1 = await fetch(`${BASE_URL}/api/demands/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zalo_name: '', apartment_number: TEST_APT_1, tv_qty: 1 }),
    });
    const valJson1 = await valRes1.json();
    assert('Test 3.1 - Chặn Tên Zalo rỗng', valRes1.status === 400 && valJson1.success === false);

    // Thiếu số căn
    const valRes2 = await fetch(`${BASE_URL}/api/demands/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zalo_name: TEST_ZALO_1, apartment_number: '', tv_qty: 1 }),
    });
    const valJson2 = await valRes2.json();
    assert('Test 3.2 - Chặn Số căn hộ rỗng', valRes2.status === 400 && valJson2.success === false);

    // Không chọn sản phẩm nào (tất cả = 0)
    const valRes3 = await fetch(`${BASE_URL}/api/demands/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zalo_name: TEST_ZALO_1, apartment_number: TEST_APT_1 }),
    });
    const valJson3 = await valRes3.json();
    assert('Test 3.3 - Chặn khi không chọn sản phẩm nào', valRes3.status === 400 && valJson3.success === false);

    // ----------------------------------------------------
    // Dọn dẹp dữ liệu test cũ nếu có
    // ----------------------------------------------------
    await fetch(`${BASE_URL}/api/admin/demands?cleanup_test=true`, {
      method: 'DELETE',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });

    // Lấy số lượng ban đầu
    const initRes = await fetch(`${BASE_URL}/api/demands/summary`);
    const initJson = await initRes.json();
    const initialHouseholds = initJson.data?.total_households || 0;
    const initialTvQty = initJson.data?.products?.find(p => p.key === 'tv')?.total_qty || 0;
    const initialSofaQty = initJson.data?.products?.find(p => p.key === 'sofa')?.total_qty || 0;

    // ----------------------------------------------------
    // Test 4: Đăng ký khảo sát Test
    // (TV=2, Sofa=1, Refrigerator=1, WashingMachine=1)
    // ----------------------------------------------------
    console.log('\n>>> Test 4: Đăng ký khảo sát mới và kiểm tra tổng hợp...');
    const submitRes = await fetch(`${BASE_URL}/api/demands/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zalo_name: TEST_ZALO_1,
        apartment_number: TEST_APT_1,
        tv_qty: 2,
        sofa_qty: 1,
        refrigerator_qty: 1,
        washing_machine_qty: 1,
      }),
    });
    const submitJson = await submitRes.json();
    assert('Test 4.1 - Đăng ký thành công HTTP 200', submitRes.status === 200 && submitJson.success === true);

    // ----------------------------------------------------
    // Test 5: Kiểm tra Thống kê Công khai tăng chính xác
    // ----------------------------------------------------
    console.log('\n>>> Test 5: Xác nhận Dashboard Công Khai cập nhật chính xác...');
    const statRes = await fetch(`${BASE_URL}/api/demands/summary`);
    const statJson = await statRes.json();
    const newSummary = statJson.data;

    assert(
      'Test 5.1 - Tổng số hộ tăng đúng +1',
      newSummary.total_households === initialHouseholds + 1,
      `(Tổng: ${newSummary.total_households})`
    );

    const tvStat = newSummary.products.find(p => p.key === 'tv');
    const sofaStat = newSummary.products.find(p => p.key === 'sofa');
    const fridgeStat = newSummary.products.find(p => p.key === 'refrigerator');
    const washerStat = newSummary.products.find(p => p.key === 'washing_machine');

    assert('Test 5.2 - Tivi tăng đúng +2', tvStat.total_qty === initialTvQty + 2, `(Tivi: ${tvStat.total_qty})`);
    assert('Test 5.3 - Sofa tăng đúng +1', sofaStat.total_qty === initialSofaQty + 1, `(Sofa: ${sofaStat.total_qty})`);
    assert('Test 5.4 - Tủ lạnh có nhu cầu >= 1', fridgeStat.total_qty >= 1);
    assert('Test 5.5 - Máy giặt có nhu cầu >= 1', washerStat.total_qty >= 1);

    // ----------------------------------------------------
    // Test 6: BẢO MẬT TUYỆT ĐỐI SỐ CĂN HỘ (CRITICAL PRIVACY TEST)
    // ----------------------------------------------------
    console.log('\n>>> Test 6: KIỂM TRA BẢO MẬT QUYỀN RIÊNG TƯ SỐ CĂN HỘ (CRITICAL)...');
    const summaryRawText = JSON.stringify(statJson);
    assert(
      'Test 6.1 - API Public KHÔNG chứa trường "apartment_number"',
      !summaryRawText.includes('apartment_number')
    );
    assert(
      'Test 6.2 - API Public KHÔNG chứa số căn test "' + TEST_APT_1 + '"',
      !summaryRawText.includes(TEST_APT_1)
    );

    // ----------------------------------------------------
    // Test 7: Cập nhật chống trùng lặp (Upsert)
    // Cùng số căn TEST_APT_1 gửi lại với Tivi=3, Tủ lạnh=2
    // ----------------------------------------------------
    console.log('\n>>> Test 7: Kiểm tra Chống Trùng Lặp (Cập nhật cùng số căn)...');
    const updateRes = await fetch(`${BASE_URL}/api/demands/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zalo_name: TEST_ZALO_1,
        apartment_number: `  ${TEST_APT_1.toLowerCase()}  `, // Test trim & uppercase
        tv_qty: 3,
        refrigerator_qty: 2,
        dryer_qty: 1,
      }),
    });
    const updateJson = await updateRes.json();
    assert(
      'Test 7.1 - Ghi nhận là cập nhật bản ghi cũ (isUpdate = true)',
      updateRes.status === 200 && updateJson.isUpdate === true
    );

    const checkRes = await fetch(`${BASE_URL}/api/demands/summary`);
    const checkJson = await checkRes.json();
    assert(
      'Test 7.2 - Tổng số hộ KHÔNG bị cộng trùng (vẫn giữ nguyên +1)',
      checkJson.data.total_households === initialHouseholds + 1
    );

    // ----------------------------------------------------
    // Test 8: Admin Authentication & API Protection
    // ----------------------------------------------------
    console.log('\n>>> Test 8: Kiểm tra Bảo vệ Quản trị (Admin)...');
    // Truy cập không có auth -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/admin/demands`);
    assert('Test 8.1 - Chặn truy cập Admin khi chưa xác thực (401)', unauthRes.status === 401);

    // Đăng nhập sai pass -> 401
    const wrongLogin = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password_123' }),
    });
    assert('Test 8.2 - Chặn đăng nhập sai mật khẩu', wrongLogin.status === 401);

    // Đăng nhập đúng pass -> 200
    const correctLogin = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    const loginJson = await correctLogin.json();
    const adminToken = loginJson.token;
    assert('Test 8.3 - Đăng nhập Admin thành công', correctLogin.status === 200 && !!adminToken);

    // Admin lấy danh sách chi tiết (thấy số căn)
    const adminListRes = await fetch(`${BASE_URL}/api/admin/demands`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const adminListJson = await adminListRes.json();
    assert('Test 8.4 - Admin xem được danh sách chi tiết', adminListRes.status === 200 && Array.isArray(adminListJson.data));

    const testRecordInAdmin = adminListJson.data.find(d => d.apartment_number === TEST_APT_1);
    assert('Test 8.5 - Admin nhìn thấy đúng Số căn hộ "' + TEST_APT_1 + '"', !!testRecordInAdmin);
    assert('Test 8.6 - Admin nhìn thấy đúng Tên Zalo "' + TEST_ZALO_1 + '"', testRecordInAdmin?.zalo_name === TEST_ZALO_1);

    // ----------------------------------------------------
    // Test 9: Admin Tìm kiếm & Lọc sản phẩm
    // ----------------------------------------------------
    console.log('\n>>> Test 9: Kiểm tra Tìm kiếm & Lọc Admin...');
    const searchRes = await fetch(`${BASE_URL}/api/admin/demands?search=${encodeURIComponent(TEST_APT_1)}`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const searchJson = await searchRes.json();
    assert('Test 9.1 - Tìm kiếm theo số căn test', searchJson.data?.length >= 1);

    const filterRes = await fetch(`${BASE_URL}/api/admin/demands?product=refrigerator`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const filterJson = await filterRes.json();
    assert('Test 9.2 - Lọc theo sản phẩm Tủ lạnh', filterJson.data?.every(d => d.refrigerator_qty > 0));

    // ----------------------------------------------------
    // Test 10: Admin Export CSV
    // ----------------------------------------------------
    console.log('\n>>> Test 10: Kiểm tra Xuất file CSV...');
    const csvRes = await fetch(`${BASE_URL}/api/admin/export-csv`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const csvBuffer = await csvRes.arrayBuffer();
    const bytes = new Uint8Array(csvBuffer);
    const hasBom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    const csvText = new TextDecoder('utf-8').decode(bytes);

    assert('Test 10.1 - Xuất CSV thành công HTTP 200', csvRes.status === 200);
    assert('Test 10.2 - CSV có BOM UTF-8 (0xEF, 0xBB, 0xBF)', hasBom === true);
    assert('Test 10.3 - CSV chứa tiêu đề cột tiếng Việt', csvText.includes('Tên Zalo') && csvText.includes('Số căn hộ'));
    assert('Test 10.4 - CSV chứa dữ liệu test', csvText.includes(TEST_APT_1));

    // ----------------------------------------------------
    // Test 11: Kiểm tra Format Đoạn Text Copy Thống Kê Nhanh Cho Zalo
    // ----------------------------------------------------
    console.log('\n>>> Test 11: Kiểm tra Đoạn Text Copy Thống Kê Nhanh...');
    const copyModule = await import('../src/components/QuickTicker.tsx');
    const sampleProducts = [
      { key: 'tv', name: 'Tivi', icon: '📺', unit: 'chiếc', total_qty: 7, households_count: 5, is_highest: false },
      { key: 'sofa', name: 'Sofa', icon: '🛋️', unit: 'bộ', total_qty: 5, households_count: 5, is_highest: false },
      { key: 'curtain', name: 'Rèm', icon: '🪟', unit: 'bộ', total_qty: 8, households_count: 6, is_highest: true },
      { key: 'drying_rack', name: 'Dàn phơi', icon: '👕', unit: 'bộ', total_qty: 6, households_count: 6, is_highest: false },
      { key: 'bed', name: 'Giường đóng sẵn', icon: '🛏️', unit: 'chiếc', total_qty: 4, households_count: 3, is_highest: false },
      { key: 'refrigerator', name: 'Tủ lạnh', icon: '❄️', unit: 'chiếc', total_qty: 7, households_count: 7, is_highest: false },
      { key: 'washing_machine', name: 'Máy giặt', icon: '🧺', unit: 'chiếc', total_qty: 6, households_count: 6, is_highest: false },
      { key: 'dryer', name: 'Máy sấy', icon: '♨️', unit: 'chiếc', total_qty: 3, households_count: 3, is_highest: false },
      { key: 'dishwasher', name: 'Máy rửa bát', icon: '🍽️', unit: 'chiếc', total_qty: 5, households_count: 5, is_highest: false },
    ];
    const generatedText = copyModule.generateZaloShareText(sampleProducts, 8);

    assert('Test 11.1 - Đoạn text có tiêu đề Zalo', generatedText.includes('📊 CẬP NHẬT NHU CẦU MUA SẮM CƯ DÂN KYOTO'));
    assert('Test 11.2 - Có số hộ tham gia', generatedText.includes('👥 Hiện có 8 hộ đã tham gia khảo sát.'));
    assert('Test 11.3 - Có đủ 9 mặt hàng', generatedText.includes('📺 Tivi: 7 chiếc') && generatedText.includes('🪟 Rèm: 8 bộ') && generatedText.includes('🍽️ Máy rửa bát: 5 chiếc'));
    assert('Test 11.4 - Có dòng Nhu cầu cao nhất', generatedText.includes('🔥 Nhu cầu cao nhất hiện tại: Rèm – 8 bộ'));
    assert('Test 11.5 - BẮT BUỘC có URL Production', generatedText.includes('https://mua-chung-do-kyoto.vercel.app/'));
    assert('Test 11.6 - KHÔNG chứa số căn hộ hoặc ID', !generatedText.includes('apartment_number') && !generatedText.includes('uuid'));

    // ----------------------------------------------------
    // Test 12: Cleanup toàn bộ Test Data
    // ----------------------------------------------------
    console.log('\n>>> Test 12: Dọn dẹp dữ liệu test...');
    const cleanRes = await fetch(`${BASE_URL}/api/admin/demands?cleanup_test=true`, {
      method: 'DELETE',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const cleanJson = await cleanRes.json();
    assert('Test 12.1 - Gọi API dọn dẹp dữ liệu test', cleanRes.status === 200 && cleanJson.success === true, `(Đã xóa ${cleanJson.deletedCount} bản ghi)`);

    const finalSummaryRes = await fetch(`${BASE_URL}/api/demands/summary`);
    const finalSummaryJson = await finalSummaryRes.json();
    assert('Test 12.2 - Tổng số hộ trở lại ban đầu', finalSummaryJson.data.total_households === initialHouseholds);

  } catch (err) {
    console.error('Lỗi nghiêm trọng trong quá trình kiểm thử:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
