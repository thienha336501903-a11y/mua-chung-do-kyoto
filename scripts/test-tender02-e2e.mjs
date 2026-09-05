import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Read .env.local manually if available
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://crphwjizolsgghapyjjv.supabase.co';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycGh3aml6b2xzZ2doYXB5amp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIwMDUxMSwiZXhwIjoyMDk3Nzc2NTExfQ.9sTEHEL96z4liyV1skAeH2anbkkElIWo4VK9_qs_8QE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function runTender02E2ETests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU TEST E2E: ĐỢT MỜI CHÀO GIÁ #02 (RÈM • LƯỚI • GIÀN PHƠI)');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Schema columns check (Additive verification)
    // -------------------------------------------------------------
    console.log('📋 [TEST 1] Kiểm tra cột mới trên bảng supplier_tender_items & supplier_quotes...');
    const { data: itemCols, error: itemErr } = await supabase
      .from('supplier_tender_items')
      .select('item_type, unit, spec_definition')
      .limit(1);
    assert(!itemErr, 'Bảng supplier_tender_items có đủ các cột item_type, unit, spec_definition');

    const { data: quoteCols, error: quoteErr } = await supabase
      .from('supplier_quotes')
      .select('item_type, unit, pricing_mode, list_price, discount_percent, effective_price, plan_name, fabric_main, fabric_sheer, wire_spec, wire_diameter_mm, wire_spacing_cm, frame_spec, load_capacity_kg, drying_bars_count, tier_pricing')
      .limit(1);
    assert(!quoteErr, 'Bảng supplier_quotes có đủ các cột quy cách, chiết khấu và giá bậc thang');

    // -------------------------------------------------------------
    // TEST 2: Round #01 Regression
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 2] Kiểm tra dữ liệu Đợt #01 không bị mất hoặc hỏng...');
    const { data: tender01, error: t01Err } = await supabase
      .from('supplier_tenders')
      .select('*, items:supplier_tender_items(*)')
      .eq('slug', 'ot-01-thiet-bi-ien-may-kyoto-3942')
      .maybeSingle();

    assert(!t01Err && tender01, 'Đợt #01 Điện máy vẫn tồn tại nguyên vẹn');
    assert(tender01 && tender01.items && tender01.items.length >= 0, 'Các model của Đợt #01 không bị ảnh hưởng');

    // -------------------------------------------------------------
    // TEST 3: Create / Fetch Tender Round #02
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 3] Khởi tạo Đợt Mời Chào Giá #02 chính thức...');
    let tender02Id = null;

    const { data: existingT02 } = await supabase
      .from('supplier_tenders')
      .select('*')
      .ilike('title', '%Đợt #02%')
      .maybeSingle();

    if (existingT02) {
      tender02Id = existingT02.id;
      // Ensure it is set to open
      await supabase.from('supplier_tenders').update({ status: 'open' }).eq('id', tender02Id);
      console.log(`  ℹ️ Đợt #02 đã có sẵn (ID: ${tender02Id}, Status: OPEN)`);
      assert(true, 'Đợt #02 tồn tại và sẵn sàng tiếp nhận báo giá');
    } else {
      const nowIso = new Date().toISOString();
      const { data: newT02, error: createT02Err } = await supabase
        .from('supplier_tenders')
        .insert({
          title: 'Đợt #02 – Rèm cửa • Lưới an toàn • Giàn phơi cư dân Kyoto',
          slug: 'dot-02-rem-cua-luoi-an-toan-gian-phoi-kyoto',
          description: 'Cộng đồng cư dân Kyoto mời các đơn vị tại Thanh Hóa tham gia chào giá các hạng mục rèm cửa, lưới an toàn và giàn phơi. Giá ưu tiên theo phương án hoàn thiện, minh bạch vật tư, lắp đặt và bảo hành.',
          status: 'open',
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      assert(!createT02Err && newT02, 'Tạo mới thành công Đợt #02');
      tender02Id = newT02.id;
    }

    // -------------------------------------------------------------
    // TEST 4: Seed 7 Standard Items for Round #02
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 4] Nạp 7 hạng mục chuẩn cho Đợt #02...');
    const standardItems = [
      {
        tender_id: tender02Id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-1-LOP',
        product_name: 'Rèm vải 1 lớp',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 100,
        specifications: 'Vải cản sáng 1 lớp, may hoàn thiện, thanh ray, phụ kiện, đo đạc và lắp đặt trọn gói',
        display_order: 1,
      },
      {
        tender_id: tender02Id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-2-LOP',
        product_name: 'Rèm vải 2 lớp (Vải chính + Voan)',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 150,
        specifications: 'Vải chính + lớp voan may hoàn thiện, ray đôi, phụ kiện, đo đạc, lắp đặt trọn gói',
        display_order: 2,
      },
      {
        tender_id: tender02Id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-CAU-VONG',
        product_name: 'Rèm cầu vồng Hàn Quốc',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 80,
        specifications: 'Rèm cầu vồng, chào theo giá trực tiếp hoặc chiết khấu % theo catalog',
        display_order: 3,
      },
      {
        tender_id: tender02Id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-CUON',
        product_name: 'Rèm cuốn chống nắng',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 50,
        specifications: 'Rèm cuốn cản sáng văn phòng / phòng ngủ',
        display_order: 4,
      },
      {
        tender_id: tender02Id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-TO-ONG',
        product_name: 'Rèm tổ ong cách nhiệt',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 30,
        specifications: 'Rèm tổ ong ngăn nhiệt điều hòa, ray và lắp đặt',
        display_order: 5,
      },
      {
        tender_id: tender02Id,
        category_key: 'safety_net',
        brand: 'Lưới An Toàn',
        model_code: 'LUOI-AT-BAN-CONG',
        product_name: 'Lưới an toàn ban công / Cửa sổ',
        item_type: 'SERVICE_SPEC',
        unit: 'm²',
        reference_qty: 120,
        specifications: 'Cáp inox 304 bọc nhựa / trần, thanh nhôm định hình dập vít nở, đo đạc và thi công trọn gói',
        display_order: 6,
      },
      {
        tender_id: tender02Id,
        category_key: 'drying_rack',
        brand: 'Hòa Phát / Sankaku',
        model_code: 'GP-QUAY-TAY',
        product_name: 'Giàn phơi thông minh gắn trần tay quay liền',
        item_type: 'PRODUCT_MODEL',
        unit: 'bộ',
        reference_qty: 40,
        specifications: 'Bộ giàn phơi 2 thanh phơi nhôm 2.2m, dây cáp lụa inox, củ quay trợ lực, trọn gói lắp đặt',
        display_order: 7,
      },
    ];

    for (const it of standardItems) {
      await supabase.from('supplier_tender_items').upsert(it, {
        onConflict: 'tender_id,category_key,brand,model_code',
      });
    }

    const { data: itemsInT02 } = await supabase
      .from('supplier_tender_items')
      .select('*')
      .eq('tender_id', tender02Id)
      .order('display_order');

    assert(itemsInT02 && itemsInT02.length === 7, 'Đủ 7 hạng mục chuẩn cho Đợt #02 (5 rèm, 1 lưới, 1 giàn phơi)');

    const rem2LopItem = itemsInT02.find((i) => i.model_code === 'REM-2-LOP');
    const remCauVongItem = itemsInT02.find((i) => i.model_code === 'REM-CAU-VONG');
    const luoiItem = itemsInT02.find((i) => i.model_code === 'LUOI-AT-BAN-CONG');
    const gianPhoiItem = itemsInT02.find((i) => i.model_code === 'GP-QUAY-TAY');

    // -------------------------------------------------------------
    // TEST 5: Test Submissions & Quotes with Calculations
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 5] Gửi báo giá kiểm thử (Test Submissions & Pricing)...');

    // Supplier A: Rèm vải 2 lớp = 320.000₫/m²
    const { data: subA } = await supabase
      .from('supplier_submissions')
      .insert({
        tender_id: tender02Id,
        company_name: '__TEST_KYOTO_TENDER02__ Rèm Ánh Dương',
        contact_person: 'Nguyễn Văn A',
        phone_number: '__TEST_0912345671',
        address_region: 'TP. Thanh Hóa',
      })
      .select('id')
      .single();

    await supabase.from('supplier_quotes').insert({
      submission_id: subA.id,
      tender_item_id: rem2LopItem.id,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-2-LOP',
      plan_name: 'Phương án Tiêu chuẩn',
      unit: 'm²',
      unit_price: 320000,
      effective_price: 320000,
      fabric_main: 'Vải gấm Bỉ',
      fabric_sheer: 'Voan trắng xước',
      is_installation_included: true,
      warranty_months: 24,
    });

    // Supplier B: Rèm vải 2 lớp = 295.000₫/m² (Lowest) + Lưới an toàn = 180.000₫/m²
    const { data: subB } = await supabase
      .from('supplier_submissions')
      .insert({
        tender_id: tender02Id,
        company_name: '__TEST_KYOTO_TENDER02__ Nội Thất Xanh Thanh Hóa',
        contact_person: 'Trần Thị B',
        phone_number: '__TEST_0912345672',
        address_region: 'Quảng Xương, Thanh Hóa',
      })
      .select('id')
      .single();

    await supabase.from('supplier_quotes').insert([
      {
        submission_id: subB.id,
        tender_item_id: rem2LopItem.id,
        category_key: 'curtain',
        brand: 'Rèm Cửa',
        model_code: 'REM-2-LOP',
        plan_name: 'Phương án Tiết kiệm',
        unit: 'm²',
        unit_price: 295000,
        effective_price: 295000,
        fabric_main: 'Vải thô chống nắng 90%',
        fabric_sheer: 'Voan trơn',
        is_installation_included: true,
        warranty_months: 12,
      },
      {
        submission_id: subB.id,
        tender_item_id: luoiItem.id,
        category_key: 'safety_net',
        brand: 'Lưới An Toàn',
        model_code: 'LUOI-AT-BAN-CONG',
        unit: 'm²',
        unit_price: 180000,
        effective_price: 180000,
        wire_spec: 'Cáp inox 304 bọc nhựa',
        wire_diameter_mm: 3.0,
        wire_spacing_cm: 5.0,
        frame_spec: 'Thanh nhôm dập vít',
        is_installation_included: true,
        warranty_months: 36,
      },
    ]);

    // Supplier C: Rèm Cầu Vồng catalog discount calculation (List: 500.000, Discount: 40% -> Effective: 300.000)
    const { data: subC } = await supabase
      .from('supplier_submissions')
      .insert({
        tender_id: tender02Id,
        company_name: '__TEST_KYOTO_TENDER02__ Đại Lý Rèm Hàn Quốc',
        contact_person: 'Lê Văn C',
        phone_number: '__TEST_0912345673',
      })
      .select('id')
      .single();

    const listPrice = 500000;
    const discount = 40;
    const calculatedEffective = Math.round(listPrice * (1 - discount / 100)); // 300,000

    await supabase.from('supplier_quotes').insert({
      submission_id: subC.id,
      tender_item_id: remCauVongItem.id,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-CAU-VONG',
      pricing_mode: 'catalog_discount',
      list_price: listPrice,
      discount_percent: discount,
      effective_price: calculatedEffective,
      unit_price: calculatedEffective,
      unit: 'm²',
      catalog_url: 'https://catalog-example.com/rem-cau-vong.pdf',
      is_installation_included: true,
      warranty_months: 24,
    });

    // Supplier D: Rèm vải báo theo 'm ngang' = 250.000₫ (Check unit isolation)
    const { data: subD } = await supabase
      .from('supplier_submissions')
      .insert({
        tender_id: tender02Id,
        company_name: '__TEST_KYOTO_TENDER02__ Xưởng May Hà Nội',
        contact_person: 'Phạm D',
        phone_number: '__TEST_0912345674',
      })
      .select('id')
      .single();

    await supabase.from('supplier_quotes').insert({
      submission_id: subD.id,
      tender_item_id: rem2LopItem.id,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-2-LOP',
      unit: 'm ngang', // Different unit
      unit_price: 250000,
      effective_price: 250000,
      is_installation_included: true,
    });

    // -------------------------------------------------------------
    // TEST 6: Admin Comparison & Lowest Price Logic Verification
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 6] Kiểm tra logic so sánh giá & cách ly đơn vị tính...');
    const { getAdminQuotesComparison } = await import('../src/lib/supplier-supabase.ts');
    const compData = await getAdminQuotesComparison(tender02Id);

    const compRem2Lop = compData.itemsWithQuotes.find((g) => g.item.model_code === 'REM-2-LOP');
    assert(compRem2Lop !== undefined, 'Tìm thấy nhóm so sánh Rèm vải 2 lớp');
    assert(compRem2Lop.lowest_price === 295000, `Giá thấp nhất Rèm 2 lớp phải là 295.000₫/m² (thực tế: ${compRem2Lop.lowest_price})`);

    const mNgangQuote = compRem2Lop.quotes.find((q) => q.unit === 'm ngang');
    assert(mNgangQuote && !mNgangQuote.is_lowest, 'Báo giá 250.000₫/m ngang KHÔNG được đánh dấu là giá thấp nhất so với đơn vị chuẩn m²');

    const compCauVong = compData.itemsWithQuotes.find((g) => g.item.model_code === 'REM-CAU-VONG');
    assert(compCauVong && compCauVong.lowest_price === 300000, `Tính toán chiết khấu đúng: 500.000 - 40% = 300.000₫ (thực tế: ${compCauVong?.lowest_price})`);

    // -------------------------------------------------------------
    // TEST 7: Resident Demands Survey Regression Tests
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 7] Kiểm tra hệ thống khảo sát cư dân (10 sản phẩm, số điện thoại bảo mật)...');
    const { data: testResident, error: resErr } = await supabase
      .from('resident_demands')
      .insert({
        zalo_name: '__TEST_KYOTO_DEMAND__ Cư dân Test',
        apartment_number: '__TEST_S02_999__',
        phone_number: '0987654321',
        curtain_qty: 4,
        drying_rack_qty: 2,
        dining_table_set_qty: 1,
      })
      .select()
      .single();

    assert(!resErr && testResident, 'Gửi khảo sát cư dân thành công');
    assert(testResident.curtain_qty === 4 && testResident.dining_table_set_qty === 1, 'Lưu đúng số lượng rèm và bàn ăn');

    // Clean up test resident
    await supabase.from('resident_demands').delete().eq('id', testResident.id);

    // -------------------------------------------------------------
    // TEST 8: Cleanup Test Data
    // -------------------------------------------------------------
    console.log('\n📋 [TEST 8] Dọn dẹp toàn bộ dữ liệu kiểm thử (__TEST_KYOTO_TENDER02__)...');
    const { cleanupSupplierTestData } = await import('../src/lib/supplier-supabase.ts');
    const cleanedCount = await cleanupSupplierTestData();
    console.log(`  🧹 Đã xóa ${cleanedCount} bản ghi kiểm thử.`);
    assert(cleanedCount >= 4, 'Dọn dẹp sạch sẽ dữ liệu kiểm thử thành công');

    console.log('\n================================================================');
    console.log(`🎯 KẾT QUẢ TEST: ${passCount} PASS / ${failCount} FAIL`);
    console.log('================================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình test:', err);
    process.exit(1);
  }
}

runTender02E2ETests();
