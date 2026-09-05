import { getSupabaseAdmin } from './supabase';
import {
  SupplierTender,
  SupplierTenderItem,
  SupplierSubmission,
  SupplierQuoteRecord,
  SubmitSupplierPayload,
  ModelComparisonGroup,
  TenderItemType,
} from '@/types/supplier';
import { isValidVietnamesePhone, normalizePhoneNumber, sanitizeText } from './utils';

/**
 * LẤY ĐỢT MỜI CHÀO GIÁ ĐANG MỞ (DÀNH CHO PUBLIC SUPPLIER)
 * Cho phép truyền slug hoặc tenderId, hoặc lấy tender open mới nhất
 */
export async function getActivePublicTender(targetIdOrSlug?: string): Promise<{
  tender: SupplierTender | null;
  items: SupplierTenderItem[];
  allOpenTenders?: SupplierTender[];
}> {
  const client = getSupabaseAdmin();

  // Lấy tất cả các tender đang mở
  const { data: openTenders } = await client
    .from('supplier_tenders')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  const allOpen = (openTenders || []) as SupplierTender[];

  let targetTender: SupplierTender | null = null;
  if (targetIdOrSlug) {
    targetTender = allOpen.find((t) => t.id === targetIdOrSlug || t.slug === targetIdOrSlug) || null;
    if (!targetTender) {
      const { data } = await client
        .from('supplier_tenders')
        .select('*')
        .or(`id.eq.${targetIdOrSlug},slug.eq.${targetIdOrSlug}`)
        .maybeSingle();
      targetTender = data;
    }
  } else {
    targetTender = allOpen.length > 0 ? allOpen[0] : null;
  }

  if (!targetTender) {
    return { tender: null, items: [], allOpenTenders: allOpen };
  }

  // Lấy các model active của đợt này
  const { data: itemsData, error: itemsError } = await client
    .from('supplier_tender_items')
    .select('*')
    .eq('tender_id', targetTender.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('[Supabase getActivePublicTender Items Error]', itemsError);
    return { tender: targetTender, items: [], allOpenTenders: allOpen };
  }

  return {
    tender: targetTender,
    items: (itemsData || []).map((it) => ({
      ...it,
      item_type: (it.item_type || 'PRODUCT_MODEL') as TenderItemType,
      unit: it.unit || 'bộ',
    })) as SupplierTenderItem[],
    allOpenTenders: allOpen,
  };
}

/**
 * NHÀ CUNG CẤP GỬI BÁO GIÁ (PUBLIC SUBMIT)
 */
export async function submitSupplierQuotes(payload: SubmitSupplierPayload): Promise<{
  success: boolean;
  submissionId?: string;
  error?: string;
}> {
  const client = getSupabaseAdmin();

  // 1. Bot & Spam validation
  if (payload.honeypot && payload.honeypot.trim() !== '') {
    return { success: false, error: 'Yêu cầu không hợp lệ (Spam detected).' };
  }

  const companyName = sanitizeText(payload.company_name || '');
  const contactPerson = sanitizeText(payload.contact_person || '');
  const rawPhone = (payload.phone_number || '').trim();
  const phone = normalizePhoneNumber(rawPhone);
  const email = payload.email ? sanitizeText(payload.email) : null;
  const addressRegion = payload.address_region ? sanitizeText(payload.address_region) : null;
  const generalNote = payload.general_note ? sanitizeText(payload.general_note) : null;

  if (!companyName || companyName.length < 2) {
    return { success: false, error: 'Vui lòng nhập Tên Nhà cung cấp / Đại lý hợp lệ' };
  }

  if (!contactPerson || contactPerson.length < 2) {
    return { success: false, error: 'Vui lòng nhập Người liên hệ' };
  }

  const isTestPhone = rawPhone.includes('__TEST_');
  if (!rawPhone || (!isTestPhone && !isValidVietnamesePhone(phone))) {
    return { success: false, error: 'Vui lòng nhập Số điện thoại / Zalo hợp lệ (Ví dụ: 0912 345 678)' };
  }

  if (!payload.quotes || payload.quotes.length === 0) {
    return { success: false, error: 'Vui lòng báo giá ít nhất 1 sản phẩm / dịch vụ' };
  }

  // 2. Validate tender exists and is open
  const { data: tender, error: tenderErr } = await client
    .from('supplier_tenders')
    .select('id, status')
    .eq('id', payload.tender_id)
    .single();

  if (tenderErr || !tender || tender.status !== 'open') {
    return { success: false, error: 'Đợt mời chào giá này hiện không mở tiếp nhận báo giá.' };
  }

  // 3. Create Submission record
  const nowIso = new Date().toISOString();
  const { data: subData, error: subErr } = await client
    .from('supplier_submissions')
    .insert({
      tender_id: payload.tender_id,
      company_name: companyName,
      contact_person: contactPerson,
      phone_number: isTestPhone ? rawPhone : phone,
      email,
      address_region: addressRegion,
      general_note: generalNote,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id')
    .single();

  if (subErr || !subData) {
    console.error('[Supabase Submission Insert Error]', subErr);
    return { success: false, error: 'Không thể tạo bản ghi báo giá, vui lòng thử lại.' };
  }

  const submissionId = subData.id;

  // 4. Create Quote rows
  const quoteRows = payload.quotes
    .map((q) => {
      // Calculate effective price accurately
      let calculatedEffectivePrice: number = Number(q.unit_price) || 0;
      const isDiscountMode = q.pricing_mode === 'catalog_discount';

      if (isDiscountMode && q.list_price && q.list_price > 0 && q.discount_percent !== undefined && q.discount_percent !== null) {
        const discount = Math.min(Math.max(Number(q.discount_percent), 0), 100);
        calculatedEffectivePrice = Math.round(Number(q.list_price) * (1 - discount / 100));
      } else if (q.unit_price && q.unit_price > 0) {
        calculatedEffectivePrice = Math.round(Number(q.unit_price));
      }

      if (calculatedEffectivePrice <= 0) {
        return null;
      }

      return {
        submission_id: submissionId,
        tender_item_id: q.tender_item_id || null,
        is_alternative: !!q.is_alternative,
        target_item_id: q.target_item_id || null,
        item_type: q.item_type || 'PRODUCT_MODEL',
        category_key: q.category_key,
        brand: sanitizeText(q.brand || ''),
        model_code: sanitizeText(q.model_code || ''),
        product_name: q.product_name ? sanitizeText(q.product_name) : null,
        plan_name: q.plan_name ? sanitizeText(q.plan_name) : null,
        unit: q.unit || 'bộ',
        pricing_mode: q.pricing_mode || 'direct',
        list_price: q.list_price ? Math.max(Number(q.list_price), 0) : null,
        discount_percent: q.discount_percent !== undefined && q.discount_percent !== null ? Number(q.discount_percent) : null,
        effective_price: calculatedEffectivePrice,
        unit_price: calculatedEffectivePrice,
        stock_status: q.stock_status || 'in_stock',
        available_qty: Math.max(Number(q.available_qty) || 1, 0),
        is_vat_included: !!q.is_vat_included,
        is_shipping_included: !!q.is_shipping_included,
        is_installation_included: !!q.is_installation_included,
        is_materials_included: q.is_materials_included !== false,
        is_survey_included: q.is_survey_included !== false,
        min_order_value: q.min_order_value ? Number(q.min_order_value) : null,
        warranty_months: q.warranty_months ? Number(q.warranty_months) : null,
        lead_time_days: q.lead_time_days ? Number(q.lead_time_days) : null,
        fabric_main: q.fabric_main ? sanitizeText(q.fabric_main) : null,
        fabric_sheer: q.fabric_sheer ? sanitizeText(q.fabric_sheer) : null,
        material: q.material ? sanitizeText(q.material) : null,
        wire_spec: q.wire_spec ? sanitizeText(q.wire_spec) : null,
        wire_diameter_mm: q.wire_diameter_mm ? Number(q.wire_diameter_mm) : null,
        wire_spacing_cm: q.wire_spacing_cm ? Number(q.wire_spacing_cm) : null,
        frame_spec: q.frame_spec ? sanitizeText(q.frame_spec) : null,
        load_capacity_kg: q.load_capacity_kg ? Number(q.load_capacity_kg) : null,
        drying_bars_count: q.drying_bars_count ? Number(q.drying_bars_count) : null,
        catalog_url: q.catalog_url ? sanitizeText(q.catalog_url) : null,
        catalog_code: q.catalog_code ? sanitizeText(q.catalog_code) : null,
        proposal_reason: q.proposal_reason ? sanitizeText(q.proposal_reason) : null,
        quote_note: q.quote_note ? sanitizeText(q.quote_note) : null,
        created_at: nowIso,
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null && q.unit_price > 0 && !!q.brand && !!q.model_code);

  if (quoteRows.length === 0) {
    // Delete submission if no valid quotes
    await client.from('supplier_submissions').delete().eq('id', submissionId);
    return { success: false, error: 'Báo giá phải có mức giá hợp lệ lớn hơn 0.' };
  }

  const { error: quoteErr } = await client.from('supplier_quotes').insert(quoteRows);

  if (quoteErr) {
    console.error('[Supabase Quotes Insert Error]', quoteErr);
    return { success: false, error: 'Lỗi khi lưu chi tiết báo giá.' };
  }

  return { success: true, submissionId };
}

// ================================================================
// ADMIN TENDER & MODEL MANAGEMENT
// ================================================================

export async function getAdminTenders(): Promise<SupplierTender[]> {
  const client = getSupabaseAdmin();

  const { data: tenders, error: tenderErr } = await client
    .from('supplier_tenders')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenderErr) {
    console.error('[Supabase getAdminTenders Error]', tenderErr);
    throw tenderErr;
  }

  // Count items and submissions for each tender
  const tendersWithCounts = await Promise.all(
    (tenders || []).map(async (t) => {
      const { count: itemsCount } = await client
        .from('supplier_tender_items')
        .select('*', { count: 'exact', head: true })
        .eq('tender_id', t.id);

      const { count: subsCount } = await client
        .from('supplier_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('tender_id', t.id);

      return {
        ...t,
        items_count: itemsCount || 0,
        suppliers_count: subsCount || 0,
      } as SupplierTender;
    })
  );

  return tendersWithCounts;
}

export async function createAdminTender(payload: {
  title: string;
  slug?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<SupplierTender> {
  const client = getSupabaseAdmin();
  const title = sanitizeText(payload.title);
  const rawSlug = (payload.slug || title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const slug = `${rawSlug}-${Date.now().toString().slice(-4)}`;
  const nowIso = new Date().toISOString();

  const { data, error } = await client
    .from('supplier_tenders')
    .insert({
      title,
      slug,
      description: payload.description ? sanitizeText(payload.description) : null,
      status: payload.status || 'draft',
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase createAdminTender Error]', error);
    throw error;
  }

  return data;
}

export async function updateAdminTender(
  id: string,
  updates: Partial<SupplierTender>
): Promise<SupplierTender> {
  const client = getSupabaseAdmin();
  const payload: any = { ...updates, updated_at: new Date().toISOString() };

  const { data, error } = await client
    .from('supplier_tenders')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase updateAdminTender Error]', error);
    throw error;
  }

  return data;
}

export async function deleteAdminTender(id: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  const { error } = await client.from('supplier_tenders').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ----------------------------------------------------------------
// ADMIN TENDER ITEMS (MODELS & SERVICE SPECS)
// ----------------------------------------------------------------

export async function getAdminTenderItems(tenderId: string): Promise<SupplierTenderItem[]> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('supplier_tender_items')
    .select('*')
    .eq('tender_id', tenderId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase getAdminTenderItems Error]', error);
    throw error;
  }

  return (data || []).map((it) => ({
    ...it,
    item_type: (it.item_type || 'PRODUCT_MODEL') as TenderItemType,
    unit: it.unit || 'bộ',
  })) as SupplierTenderItem[];
}

export async function addAdminTenderItem(payload: {
  tender_id: string;
  category_key: string;
  brand: string;
  model_code: string;
  product_name?: string;
  item_type?: TenderItemType;
  unit?: string;
  reference_qty: number;
  specifications?: string;
  spec_definition?: Record<string, any>;
  display_order?: number;
}): Promise<SupplierTenderItem> {
  const client = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const brand = sanitizeText(payload.brand || '');
  const modelCode = sanitizeText(payload.model_code || '').trim().toUpperCase();

  const { data, error } = await client
    .from('supplier_tender_items')
    .insert({
      tender_id: payload.tender_id,
      category_key: payload.category_key,
      brand,
      model_code: modelCode,
      product_name: payload.product_name ? sanitizeText(payload.product_name) : null,
      item_type: payload.item_type || 'PRODUCT_MODEL',
      unit: payload.unit || 'bộ',
      reference_qty: Math.max(Number(payload.reference_qty) || 1, 0),
      specifications: payload.specifications ? sanitizeText(payload.specifications) : null,
      spec_definition: payload.spec_definition || null,
      display_order: Number(payload.display_order) || 0,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Hạng mục/Model "${brand} ${modelCode}" đã có trong đợt chào giá này.`);
    }
    console.error('[Supabase addAdminTenderItem Error]', error);
    throw error;
  }

  return data;
}

export async function updateAdminTenderItem(
  id: string,
  updates: Partial<SupplierTenderItem>
): Promise<SupplierTenderItem> {
  const client = getSupabaseAdmin();
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  if (payload.brand) payload.brand = sanitizeText(payload.brand);
  if (payload.model_code) payload.model_code = sanitizeText(payload.model_code).trim().toUpperCase();

  const { data, error } = await client
    .from('supplier_tender_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAdminTenderItem(id: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  const { error } = await client.from('supplier_tender_items').delete().eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * TỰ ĐỘNG KHỞI TẠO CÁC HẠNG MỤC MẪU CHO ĐỢT #02 (4 LOẠI RÈM, LƯỚI, GIÀN PHƠI)
 */
export async function seedTender02StandardItems(tenderId: string): Promise<SupplierTenderItem[]> {
  const standardItems: Array<Parameters<typeof addAdminTenderItem>[0]> = [
    // RÈM CỬA (4 LOẠI CHUẨN)
    {
      tender_id: tenderId,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-1-LOP',
      product_name: 'Rèm vải 1 lớp',
      item_type: 'SERVICE_SPEC',
      unit: 'm²',
      reference_qty: 100,
      specifications: 'Rèm vải 1 lớp may hoàn thiện, bao gồm thanh ray, phụ kiện, đo đạc, lắp đặt',
      display_order: 1,
    },
    {
      tender_id: tenderId,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-2-LOP',
      product_name: 'Rèm vải 2 lớp (Vải chính + Voan)',
      item_type: 'SERVICE_SPEC',
      unit: 'm²',
      reference_qty: 150,
      specifications: 'Rèm vải 2 lớp hoàn thiện (lớp vải cản sáng + lớp voan), ray đôi, phụ kiện, đo đạc, lắp đặt',
      display_order: 2,
    },
    {
      tender_id: tenderId,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-CAU-VONG',
      product_name: 'Rèm cầu vồng Hàn Quốc',
      item_type: 'SERVICE_SPEC',
      unit: 'm²',
      reference_qty: 80,
      specifications: 'Rèm cầu vồng hiện đại, chào theo giá trực tiếp hoặc chiết khấu % theo catalog',
      display_order: 3,
    },
    {
      tender_id: tenderId,
      category_key: 'curtain',
      brand: 'Rèm Cửa',
      model_code: 'REM-TO-ONG',
      product_name: 'Rèm tổ ong cách nhiệt',
      item_type: 'SERVICE_SPEC',
      unit: 'm²',
      reference_qty: 30,
      specifications: 'Rèm tổ ong ngăn lạnh, cách nhiệt, hoàn thiện ray và lắp đặt',
      display_order: 4,
    },
    // LƯỚI AN TOÀN
    {
      tender_id: tenderId,
      category_key: 'safety_net',
      brand: 'Lưới An Toàn',
      model_code: 'LUOI-AT-BAN-CONG',
      product_name: 'Lưới an toàn ban công / Cửa sổ',
      item_type: 'SERVICE_SPEC',
      unit: 'm²',
      reference_qty: 120,
      specifications: 'Cáp inox 304 bọc nhựa / trần, thanh nhôm định hình dập vít nở, đo đạc và thi công trọn gói',
      display_order: 5,
    },
    // GIÀN PHƠI THÔNG MINH
    {
      tender_id: tenderId,
      category_key: 'drying_rack',
      brand: 'Hòa Phát / Sankaku',
      model_code: 'GP-QUAY-TAY',
      product_name: 'Giàn phơi thông minh gắn trần tay quay liền',
      item_type: 'PRODUCT_MODEL',
      unit: 'bộ',
      reference_qty: 40,
      specifications: 'Bộ giàn phơi 2 thanh phơi nhôm 2.2m, dây cáp lụa inox, củ quay trợ lực, trọn gói lắp đặt',
      display_order: 6,
    },
  ];

  const added: SupplierTenderItem[] = [];
  for (const item of standardItems) {
    try {
      const res = await addAdminTenderItem(item);
      added.push(res);
    } catch (e) {
      // Ignore duplicate if already seeded
    }
  }
  return added;
}

// ================================================================
// ADMIN QUOTES COMPARISON MATRIX
// ================================================================

export async function getAdminQuotesComparison(tenderId?: string): Promise<{
  tender: SupplierTender | null;
  itemsWithQuotes: ModelComparisonGroup[];
  allSubmissions: SupplierSubmission[];
  allQuotes: SupplierQuoteRecord[];
}> {
  const client = getSupabaseAdmin();

  // 1. Get target tender
  let targetTender: SupplierTender | null = null;
  if (tenderId) {
    const { data } = await client.from('supplier_tenders').select('*').eq('id', tenderId).maybeSingle();
    targetTender = data;
  } else {
    // Get latest active or latest tender
    const { data } = await client
      .from('supplier_tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    targetTender = data;
  }

  if (!targetTender) {
    return {
      tender: null,
      itemsWithQuotes: [],
      allSubmissions: [],
      allQuotes: [],
    };
  }

  // 2. Get all tender items
  const { data: items } = await client
    .from('supplier_tender_items')
    .select('*')
    .eq('tender_id', targetTender.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  const tenderItems: SupplierTenderItem[] = (items || []).map((it) => ({
    ...it,
    item_type: (it.item_type || 'PRODUCT_MODEL') as TenderItemType,
    unit: it.unit || 'bộ',
  }));

  // 3. Get all submissions with tender
  const { data: submissions } = await client
    .from('supplier_submissions')
    .select('*')
    .eq('tender_id', targetTender.id)
    .order('created_at', { ascending: false });

  const submissionIds = (submissions || []).map((s) => s.id);

  // 4. Get all quotes with submissions
  let quotes: SupplierQuoteRecord[] = [];
  if (submissionIds.length > 0) {
    const { data: quotesData } = await client
      .from('supplier_quotes')
      .select('*, submission:supplier_submissions(company_name, contact_person, phone_number, email, address_region)')
      .in('submission_id', submissionIds)
      .order('unit_price', { ascending: true });

    quotes = (quotesData || []).map((q) => ({
      ...q,
      effective_price: q.effective_price || q.unit_price,
    })) as SupplierQuoteRecord[];
  }

  // 5. Build ModelComparisonGroup for each item
  const itemsWithQuotes: ModelComparisonGroup[] = tenderItems.map((item) => {
    // Direct quotes for this item (is_alternative = false)
    const directQuotes = quotes.filter(
      (q) =>
        !q.is_alternative &&
        (q.tender_item_id === item.id ||
          (q.brand.toLowerCase() === item.brand.toLowerCase() && q.model_code.toLowerCase() === item.model_code.toLowerCase()))
    );

    // Alternative quotes for this item (is_alternative = true & target_item_id = item.id)
    const alternativeQuotes = quotes.filter(
      (q) => q.is_alternative && q.target_item_id === item.id
    );

    // Calculate lowest effective price ONLY for quotes matching the item's standard unit
    const itemUnit = item.unit.trim().toLowerCase();
    const matchingUnitQuotes = directQuotes.filter(
      (q) => (q.unit || 'bộ').trim().toLowerCase() === itemUnit
    );

    let lowestPrice: number | null = null;
    if (matchingUnitQuotes.length > 0) {
      lowestPrice = Math.min(...matchingUnitQuotes.map((q) => Number(q.effective_price || q.unit_price)));
    }

    const quotesWithLowestFlag = directQuotes.map((q) => {
      const qEff = Number(q.effective_price || q.unit_price);
      const isSameUnit = (q.unit || 'bộ').trim().toLowerCase() === itemUnit;
      const isLowest = isSameUnit && lowestPrice !== null && qEff === lowestPrice;

      return {
        ...q,
        is_lowest: isLowest,
      };
    });

    return {
      item,
      lowest_price: lowestPrice,
      quotes: quotesWithLowestFlag,
      alternative_quotes: alternativeQuotes,
    };
  });

  return {
    tender: targetTender,
    itemsWithQuotes,
    allSubmissions: (submissions || []) as SupplierSubmission[],
    allQuotes: quotes,
  };
}

/**
 * CẬP NHẬT TRẠNG THÁI SHORTLIST / ĐÃ CHỌN CHO BÁO GIÁ HOẶC SUBMISSION
 */
export async function updateQuoteStatus(
  quoteId: string,
  updates: { is_shortlisted?: boolean; is_selected_for_contact?: boolean }
): Promise<SupplierQuoteRecord> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('supplier_quotes')
    .update(updates)
    .eq('id', quoteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubmissionStatus(
  submissionId: string,
  updates: { is_shortlisted?: boolean; is_selected_for_contact?: boolean; admin_private_note?: string }
): Promise<SupplierSubmission> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('supplier_submissions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * DỌN DẸP TOÀN BỘ TEST DATA CỦA SUPPLIER
 */
export async function cleanupSupplierTestData(): Promise<number> {
  const client = getSupabaseAdmin();
  const { data: subs } = await client
    .from('supplier_submissions')
    .delete()
    .or('company_name.ilike.%__TEST%,contact_person.ilike.%__TEST%,phone_number.ilike.%__TEST%')
    .select();

  const { data: tenders } = await client
    .from('supplier_tenders')
    .delete()
    .or('title.ilike.%__TEST%,slug.ilike.%__TEST%')
    .select();

  return (subs?.length || 0) + (tenders?.length || 0);
}
