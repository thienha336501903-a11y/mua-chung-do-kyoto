/**
 * KỊCH BẢN KIỂM THỬ E2E TOÀN DIỆN CHO MODULE NHÀ PHÂN PHỐI / ĐẠI LÝ CHÀO GIÁ TỐT
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kyoto2026@admin';

async function runSupplierE2ETests() {
  console.log('====================================================');
  console.log('BẮT ĐẦU KIỂM THỬ MODULE NHÀ PHÂN PHỐI / ĐẠI LÝ (E2E)');
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

  let adminToken = '';
  let testTenderId = '';
  let testItemId1 = '';
  let testItemId2 = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Admin Login & Auth
    // ----------------------------------------------------
    console.log('>>> Test 1: Đăng nhập Admin...');
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    const loginJson = await loginRes.json();
    adminToken = loginJson.token;
    assert('Test 1.1 - Đăng nhập Admin thành công', loginRes.status === 200 && !!adminToken);

    // ----------------------------------------------------
    // TEST 2: Admin tạo Đợt chào giá Test
    // ----------------------------------------------------
    console.log('\n>>> Test 2: Admin tạo Đợt Mời Chào Giá Test...');
    const createTenderRes = await fetch(`${BASE_URL}/api/admin/tenders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: '__TEST_TENDER__ Mua Chung Kyoto Thử Nghiệm',
        description: 'Đợt chào giá kiểm thử tự động',
        status: 'draft',
      }),
    });
    const createTenderJson = await createTenderRes.json();
    testTenderId = createTenderJson.data?.id;
    assert(
      'Test 2.1 - Tạo đợt chào giá thành công',
      createTenderRes.status === 200 && !!testTenderId
    );

    // ----------------------------------------------------
    // TEST 3: Admin thêm các Model vào Đợt chào giá
    // ----------------------------------------------------
    console.log('\n>>> Test 3: Thêm Model vào đợt chào giá...');
    // Model 1: Tủ lạnh Panasonic
    const addItemRes1 = await fetch(`${BASE_URL}/api/admin/tenders/${testTenderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category_key: 'refrigerator',
        brand: 'Panasonic',
        model_code: '__TEST_NR_TX461__',
        reference_qty: 28,
        product_name: 'Tủ lạnh Panasonic Inverter 405L',
      }),
    });
    const addItemJson1 = await addItemRes1.json();
    testItemId1 = addItemJson1.data?.id;
    assert('Test 3.1 - Thêm Model 1 thành công', addItemRes1.status === 200 && !!testItemId1);

    // Model 2: Tivi Sony
    const addItemRes2 = await fetch(`${BASE_URL}/api/admin/tenders/${testTenderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category_key: 'tv',
        brand: 'Sony',
        model_code: '__TEST_65X90L__',
        reference_qty: 15,
        product_name: 'Google Tivi Sony 4K 65 inch',
      }),
    });
    const addItemJson2 = await addItemRes2.json();
    testItemId2 = addItemJson2.data?.id;
    assert('Test 3.2 - Thêm Model 2 thành công', addItemRes2.status === 200 && !!testItemId2);

    // Test Duplicate Prevention
    const dupRes = await fetch(`${BASE_URL}/api/admin/tenders/${testTenderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        category_key: 'refrigerator',
        brand: 'Panasonic',
        model_code: '__TEST_NR_TX461__', // Trùng lặp
        reference_qty: 28,
      }),
    });
    assert('Test 3.3 - Chống trùng lặp Model trong cùng 1 đợt', dupRes.status === 400);

    // ----------------------------------------------------
    // TEST 4: Mở đợt chào giá (Status -> Open)
    // ----------------------------------------------------
    console.log('\n>>> Test 4: Chuyển trạng thái Đợt chào giá sang OPEN...');
    const openRes = await fetch(`${BASE_URL}/api/admin/tenders/${testTenderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'open' }),
    });
    assert('Test 4.1 - Mở đợt chào giá thành công', openRes.status === 200);

    // ----------------------------------------------------
    // TEST 5: Public API kiểm tra đợt active
    // ----------------------------------------------------
    console.log('\n>>> Test 5: Kiểm tra Public API /api/supplier/tenders/active...');
    const publicTenderRes = await fetch(`${BASE_URL}/api/supplier/tenders/active`);
    const publicTenderJson = await publicTenderRes.json();
    assert(
      'Test 5.1 - Public API trả về đợt đang mở',
      publicTenderRes.status === 200 && publicTenderJson.data?.tender?.id === testTenderId
    );
    assert(
      'Test 5.2 - Danh sách model công khai có ít nhất 2 model test',
      publicTenderJson.data?.items?.length >= 2
    );

    // ----------------------------------------------------
    // TEST 6: Nhà Cung Cấp A gửi báo giá (Giá cao hơn)
    // ----------------------------------------------------
    console.log('\n>>> Test 6: Nhà cung cấp A gửi báo giá...');
    const submitResA = await fetch(`${BASE_URL}/api/supplier/quotes/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tender_id: testTenderId,
        company_name: '__TEST_SUPPLIER_A__ Điện Máy Thành Đô',
        contact_person: 'Anh Tuấn',
        phone_number: '0912345678',
        quotes: [
          {
            tender_item_id: testItemId1,
            category_key: 'refrigerator',
            brand: 'Panasonic',
            model_code: '__TEST_NR_TX461__',
            unit_price: 12500000,
            available_qty: 30,
            is_vat_included: true,
            is_shipping_included: true,
          },
        ],
      }),
    });
    const submitJsonA = await submitResA.json();
    assert('Test 6.1 - Nhà cung cấp A gửi báo giá thành công', submitResA.status === 200 && submitJsonA.success);

    // ----------------------------------------------------
    // TEST 7: Nhà Cung Cấp B gửi báo giá (Giá rẻ hơn + Model tương đương)
    // ----------------------------------------------------
    console.log('\n>>> Test 7: Nhà cung cấp B gửi báo giá kèm Model tương đương...');
    const submitResB = await fetch(`${BASE_URL}/api/supplier/quotes/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tender_id: testTenderId,
        company_name: '__TEST_SUPPLIER_B__ Tổng Kho Điện Máy Hà Nội',
        contact_person: 'Chị Mai',
        phone_number: '0987654321',
        quotes: [
          // Báo giá rẻ hơn cho model gốc
          {
            tender_item_id: testItemId1,
            category_key: 'refrigerator',
            brand: 'Panasonic',
            model_code: '__TEST_NR_TX461__',
            unit_price: 11800000, // Thấp hơn A (12.5tr)
            available_qty: 50,
            is_vat_included: true,
            is_shipping_included: true,
          },
          // Đề xuất model thay thế
          {
            tender_item_id: testItemId1,
            is_alternative: true,
            target_item_id: testItemId1,
            category_key: 'refrigerator',
            brand: 'Toshiba',
            model_code: '__TEST_GR_RT468WE__',
            product_name: 'Tủ lạnh Toshiba Inverter 411L',
            unit_price: 10900000,
            available_qty: 40,
            proposal_reason: 'Dung tích tương đương 411L, giá tốt hơn 1 triệu',
          },
        ],
      }),
    });
    const submitJsonB = await submitResB.json();
    assert('Test 7.1 - Nhà cung cấp B gửi báo giá thành công', submitResB.status === 200 && submitJsonB.success);

    // ----------------------------------------------------
    // TEST 8: Admin Xem Ma Trận So Sánh Giá & Lowest Price Highlight
    // ----------------------------------------------------
    console.log('\n>>> Test 8: Admin kiểm tra bảng so sánh giá...');
    const quotesRes = await fetch(`${BASE_URL}/api/admin/quotes?tender_id=${testTenderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const quotesJson = await quotesRes.json();
    const comparisonGroups = quotesJson.data?.itemsWithQuotes || [];

    const fridgeGroup = comparisonGroups.find((g) => g.item.id === testItemId1);
    assert('Test 8.1 - Tìm thấy nhóm so sánh Tủ lạnh', !!fridgeGroup);
    assert(
      'Test 8.2 - Tự động xác định đúng GIÁ THẤP NHẤT = 11.800.000₫',
      fridgeGroup?.lowest_price === 11800000
    );
    assert(
      'Test 8.3 - Có đúng 2 báo giá trực tiếp từ 2 nhà cung cấp',
      fridgeGroup?.quotes?.length === 2
    );
    assert(
      'Test 8.4 - Báo giá của NCC B được gắn cờ is_lowest = true',
      fridgeGroup?.quotes?.find((q) => q.submission?.company_name.includes('SUPPLIER_B'))?.is_lowest === true
    );
    assert(
      'Test 8.5 - Có đúng 1 model tương đương được gom vào nhóm này',
      fridgeGroup?.alternative_quotes?.length === 1 &&
        fridgeGroup?.alternative_quotes[0]?.brand === 'Toshiba'
    );

    // ----------------------------------------------------
    // TEST 9: Admin Cập nhật Shortlist & Selected For Contact
    // ----------------------------------------------------
    console.log('\n>>> Test 9: Admin đánh dấu Shortlist & Đã chọn để liên hệ...');
    const lowestQuoteId = fridgeGroup?.quotes?.find((q) => q.is_lowest)?.id;
    if (lowestQuoteId) {
      const patchRes = await fetch(`${BASE_URL}/api/admin/quotes/${lowestQuoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_shortlisted: true, is_selected_for_contact: true }),
      });
      const patchJson = await patchRes.json();
      assert('Test 9.1 - Cập nhật Shortlist thành công', patchRes.status === 200 && patchJson.data?.is_shortlisted);
    }

    // ----------------------------------------------------
    // TEST 10: Admin Xuất File CSV Báo Giá
    // ----------------------------------------------------
    console.log('\n>>> Test 10: Xuất file CSV Báo Giá...');
    const csvRes = await fetch(`${BASE_URL}/api/admin/quotes/export-csv?tender_id=${testTenderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvBuffer = await csvRes.arrayBuffer();
    const bytes = new Uint8Array(csvBuffer);
    const hasBom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    const csvText = new TextDecoder('utf-8').decode(bytes);

    assert('Test 10.1 - Xuất CSV thành công HTTP 200', csvRes.status === 200);
    assert('Test 10.2 - File CSV có BOM UTF-8', hasBom === true);
    assert('Test 10.3 - File CSV chứa dữ liệu Nhà cung cấp', csvText.includes('SUPPLIER_A') && csvText.includes('SUPPLIER_B'));

    // ----------------------------------------------------
    // TEST 11: Bảo Mật Quyền Riêng Tư (Security & Privacy)
    // ----------------------------------------------------
    console.log('\n>>> Test 11: Kiểm tra Bảo mật Quyền Riêng Tư...');
    const unauthorizedRes = await fetch(`${BASE_URL}/api/admin/quotes`);
    assert('Test 11.1 - Chặn truy cập API báo giá khi không có Token Admin', unauthorizedRes.status === 401);

    const publicRes = await fetch(`${BASE_URL}/api/demands/summary`);
    const publicText = await publicRes.text();
    assert('Test 11.2 - API Public cư dân tuyệt đối KHÔNG chứa báo giá hay liên hệ NCC', !publicText.includes('SUPPLIER_A') && !publicText.includes('11800000'));

    // ----------------------------------------------------
    // TEST 12: Dọn dẹp dữ liệu kiểm thử
    // ----------------------------------------------------
    console.log('\n>>> Test 12: Dọn dẹp dữ liệu test Supplier...');
    const cleanRes = await fetch(`${BASE_URL}/api/admin/tenders?cleanup_test=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const cleanJson = await cleanRes.json();
    assert(
      'Test 12.1 - Xóa sạch dữ liệu test',
      cleanRes.status === 200 && cleanJson.success,
      `(Đã xóa ${cleanJson.deletedCount} bản ghi)`
    );

  } catch (err) {
    console.error('Lỗi nghiêm trọng trong kiểm thử:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSupplierE2ETests();
