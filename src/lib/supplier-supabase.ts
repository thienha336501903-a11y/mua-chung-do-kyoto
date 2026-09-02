import { getSupabaseAdmin } from './supabase';
import {
  SupplierTender,
  SupplierTenderItem,
  SupplierSubmission,
  SupplierQuoteRecord,
  SubmitSupplierPayload,
  ModelComparisonGroup,
} from '@/types/supplier';
import { isValidVietnamesePhone, normalizePhoneNumber, sanitizeText } from './utils';

/**
 * LẤY ĐỢT MỜI CHÀO GIÁ ĐANG MỞ (DÀNH CHO PUBLIC SUPPLIER)
 */
export async function getActivePublicTender(): Promise<{
  tender: SupplierTender | null;
  items: SupplierTenderItem[];
}> {
  const client = getSupabaseAdmin();

  // Tìm tender có status = 'open' gần nhất
  const { data: tenderData, error: tenderError } = await client
    .from('supplier_tenders')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tenderError || !tenderData) {
    return { tender: null, items: [] };
  }

  // Lấy các model active của đợt này
  const { data: itemsData, error: itemsError } = await client
    .from('supplier_tender_items')
    .select('*')
    .eq('tender_id', tenderData.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('[Supabase getActivePublicTender Items Error]', itemsError);
    return { tender: tenderData as SupplierTender, items: [] };
  }

  return {
    tender: tenderData as SupplierTender,
    items: (itemsData || []) as SupplierTenderItem[],
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
    return { success: false, error: 'Vui lòng báo giá ít nhất 1 sản phẩm' };
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
  const quoteRows = payload.quotes.map((q) => {
    return {
      submission_id: submissionId,
      tender_item_id: q.tender_item_id || null,
      is_alternative: !!q.is_alternative,
      target_item_id: q.target_item_id || null,
      category_key: q.category_key,
      brand: sanitizeText(q.brand || ''),
      model_code: sanitizeText(q.model_code || ''),
      product_name: q.product_name ? sanitizeText(q.product_name) : null,
      unit_price: Math.max(Number(q.unit_price) || 0, 0),
      stock_status: q.stock_status || 'in_stock',
      available_qty: Math.max(Number(q.available_qty) || 1, 0),
      is_vat_included: !!q.is_vat_included,
      is_shipping_included: !!q.is_shipping_included,
      is_installation_included: !!q.is_installation_included,
      warranty_months: q.warranty_months ? Number(q.warranty_months) : null,
      lead_time_days: q.lead_time_days ? Number(q.lead_time_days) : null,
      proposal_reason: q.proposal_reason ? sanitizeText(q.proposal_reason) : null,
      quote_note: q.quote_note ? sanitizeText(q.quote_note) : null,
      created_at: nowIso,
    };
  }).filter((q) => q.unit_price > 0 && q.brand && q.model_code);

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
// ADMIN TENDER ITEMS (MODELS)
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

  return data || [];
}

export async function addAdminTenderItem(payload: {
  tender_id: string;
  category_key: string;
  brand: string;
  model_code: string;
  product_name?: string;
  reference_qty: number;
  specifications?: string;
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
      reference_qty: Math.max(Number(payload.reference_qty) || 1, 0),
      specifications: payload.specifications ? sanitizeText(payload.specifications) : null,
      display_order: Number(payload.display_order) || 0,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Model "${brand} ${modelCode}" đã có trong đợt chào giá này.`);
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

  // 3. Get all submissions with tender
  const { data: submissions } = await client
    .from('supplier_submissions')
    .select('*')
    .eq('tender_id', targetTender.id)
    .order('created_at', { ascending: false });

  const submissionIds = (submissions || []).map((s) => s.id);

  // 4. Get all quotes with submissions
  let quotes: any[] = [];
  if (submissionIds.length > 0) {
    const { data: quotesData } = await client
      .from('supplier_quotes')
      .select('*, submission:supplier_submissions(company_name, contact_person, phone_number, email, address_region)')
      .in('submission_id', submissionIds)
      .order('unit_price', { ascending: true });

    quotes = quotesData || [];
  }

  // 5. Build ModelComparisonGroup for each item
  const itemsWithQuotes: ModelComparisonGroup[] = (items || []).map((item) => {
    // Direct quotes for this item (is_alternative = false)
    const directQuotes = quotes.filter(
      (q) => !q.is_alternative && (q.tender_item_id === item.id || (q.brand.toLowerCase() === item.brand.toLowerCase() && q.model_code.toLowerCase() === item.model_code.toLowerCase()))
    );

    // Alternative quotes for this item (is_alternative = true & target_item_id = item.id)
    const alternativeQuotes = quotes.filter(
      (q) => q.is_alternative && q.target_item_id === item.id
    );

    // Calculate lowest direct price
    let lowestPrice: number | null = null;
    if (directQuotes.length > 0) {
      lowestPrice = Math.min(...directQuotes.map((q) => Number(q.unit_price)));
    }

    const quotesWithLowestFlag = directQuotes.map((q) => ({
      ...q,
      is_lowest: lowestPrice !== null && Number(q.unit_price) === lowestPrice,
    }));

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
    allSubmissions: submissions || [],
    allQuotes: quotes || [],
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
  const { data: subs, error: subErr } = await client
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
