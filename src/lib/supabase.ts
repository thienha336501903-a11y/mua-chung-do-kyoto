import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from './constants';
import { DemandSummaryData, ProductDemandStat, ProductKey, ResidentDemandRecord, SubmitDemandPayload } from '@/types/demand';
import { isValidVietnamesePhone, normalizeApartment, normalizePhoneNumber, sanitizeText } from './utils';

const supabaseUrl = process.env.SUPABASE_URL || 'https://crphwjizolsgghapyjjv.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycGh3aml6b2xzZ2doYXB5amp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIwMDUxMSwiZXhwIjoyMDk3Nzc2NTExfQ.9sTEHEL96z4liyV1skAeH2anbkkElIWo4VK9_qs_8QE';

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL hoặc Service Role Key chưa được cấu hình.');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Lấy dữ liệu tổng hợp công khai (Public Summary)
 * TUYỆT ĐỐI KHÔNG SELECT VÀ KHÔNG TRẢ VỀ apartment_number, phone_number HAY zalo_name
 */
export async function getPublicDemandSummary(): Promise<DemandSummaryData> {
  const client = getSupabaseAdmin();

  // Thử gọi hàm RPC get_demand_summary trước nếu có
  try {
    const { data: rpcData, error: rpcError } = await client.rpc('get_demand_summary');
    if (!rpcError && rpcData) {
      return formatRpcSummary(rpcData);
    }
  } catch (err) {
    // Nếu chưa tạo RPC thì query an toàn
  }

  // Query an toàn: CHỈ SELECT các cột số lượng sản phẩm, KHÔNG select apartment_number, phone_number hay tên
  const { data, error } = await client
    .from('resident_demands')
    .select('tv_qty, sofa_qty, curtain_qty, drying_rack_qty, bed_qty, refrigerator_qty, washing_machine_qty, dryer_qty, dishwasher_qty');

  if (error) {
    console.error('[Supabase getPublicDemandSummary Error]', error);
    return getEmptySummary();
  }

  const rows = data || [];
  const total_households = rows.length;

  // Tính tổng số lượng và số hộ có nhu cầu từng loại
  const statsMap: Record<ProductKey, { total_qty: number; households_count: number }> = {
    tv: { total_qty: 0, households_count: 0 },
    sofa: { total_qty: 0, households_count: 0 },
    curtain: { total_qty: 0, households_count: 0 },
    drying_rack: { total_qty: 0, households_count: 0 },
    bed: { total_qty: 0, households_count: 0 },
    refrigerator: { total_qty: 0, households_count: 0 },
    washing_machine: { total_qty: 0, households_count: 0 },
    dryer: { total_qty: 0, households_count: 0 },
    dishwasher: { total_qty: 0, households_count: 0 },
  };

  rows.forEach((row: any) => {
    PRODUCTS.forEach((p) => {
      const qty = Number(row[p.dbField]) || 0;
      if (qty > 0) {
        statsMap[p.key].total_qty += qty;
        statsMap[p.key].households_count += 1;
      }
    });
  });

  // Tìm sản phẩm có tổng nhu cầu cao nhất
  let maxQty = 0;
  PRODUCTS.forEach((p) => {
    if (statsMap[p.key].total_qty > maxQty) {
      maxQty = statsMap[p.key].total_qty;
    }
  });

  const products: ProductDemandStat[] = PRODUCTS.map((p) => {
    const stat = statsMap[p.key];
    return {
      key: p.key,
      name: p.name,
      icon: p.icon,
      unit: p.unit,
      total_qty: stat.total_qty,
      households_count: stat.households_count,
      is_highest: maxQty > 0 && stat.total_qty === maxQty,
    };
  });

  const highest_products = products.filter((p) => p.is_highest).map((p) => p.name);

  return {
    total_households,
    products,
    highest_quantity: maxQty,
    highest_products,
    updated_at: new Date().toISOString(),
  };
}

function formatRpcSummary(rpc: any): DemandSummaryData {
  let maxQty = 0;
  PRODUCTS.forEach((p) => {
    const q = rpc[p.key]?.total_qty || 0;
    if (q > maxQty) maxQty = q;
  });

  const products: ProductDemandStat[] = PRODUCTS.map((p) => {
    const q = rpc[p.key]?.total_qty || 0;
    const h = rpc[p.key]?.households_count || 0;
    return {
      key: p.key,
      name: p.name,
      icon: p.icon,
      unit: p.unit,
      total_qty: q,
      households_count: h,
      is_highest: maxQty > 0 && q === maxQty,
    };
  });

  return {
    total_households: rpc.total_households || 0,
    products,
    highest_quantity: maxQty,
    highest_products: products.filter((p) => p.is_highest).map((p) => p.name),
    updated_at: rpc.updated_at || new Date().toISOString(),
  };
}

function getEmptySummary(): DemandSummaryData {
  return {
    total_households: 0,
    products: PRODUCTS.map((p) => ({
      key: p.key,
      name: p.name,
      icon: p.icon,
      unit: p.unit,
      total_qty: 0,
      households_count: 0,
      is_highest: false,
    })),
    highest_quantity: 0,
    highest_products: [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Đăng ký hoặc Cập nhật Nhu cầu cư dân (Chống trùng lặp theo số căn)
 */
export async function submitResidentDemand(input: SubmitDemandPayload): Promise<{
  success: boolean;
  isUpdate: boolean;
  data?: any;
  error?: string;
}> {
  const client = getSupabaseAdmin();

  const zaloName = sanitizeText(input.zalo_name || '');
  const apartment = normalizeApartment(input.apartment_number || '');
  const rawPhone = (input.phone_number || '').trim();
  const phone = normalizePhoneNumber(rawPhone);

  if (!zaloName || zaloName.length < 2 || zaloName.length > 100) {
    return { success: false, isUpdate: false, error: 'Tên Zalo phải từ 2 đến 100 ký tự' };
  }

  if (!apartment || apartment.length < 2 || apartment.length > 30) {
    return { success: false, isUpdate: false, error: 'Số căn hộ không hợp lệ (Ví dụ: K5-1208)' };
  }

  // Cho phép tiền tố kiểm thử __TEST_PHONE__ hoặc số điện thoại chuẩn Việt Nam
  const isTestPhone = rawPhone.includes('__TEST_');
  if (!rawPhone || (!isTestPhone && !isValidVietnamesePhone(phone))) {
    return { success: false, isUpdate: false, error: 'Vui lòng nhập số điện thoại hợp lệ (Ví dụ: 0912 345 678)' };
  }

  const payload: any = {
    zalo_name: zaloName,
    apartment_number: apartment,
    phone_number: isTestPhone ? rawPhone : phone,
    tv_qty: Math.min(Math.max(Number(input.tv_qty) || 0, 0), 10),
    sofa_qty: Math.min(Math.max(Number(input.sofa_qty) || 0, 0), 10),
    curtain_qty: Math.min(Math.max(Number(input.curtain_qty) || 0, 0), 10),
    drying_rack_qty: Math.min(Math.max(Number(input.drying_rack_qty) || 0, 0), 10),
    bed_qty: Math.min(Math.max(Number(input.bed_qty) || 0, 0), 10),
    refrigerator_qty: Math.min(Math.max(Number(input.refrigerator_qty) || 0, 0), 10),
    washing_machine_qty: Math.min(Math.max(Number(input.washing_machine_qty) || 0, 0), 10),
    dryer_qty: Math.min(Math.max(Number(input.dryer_qty) || 0, 0), 10),
    dishwasher_qty: Math.min(Math.max(Number(input.dishwasher_qty) || 0, 0), 10),
    note: input.note ? sanitizeText(input.note) : null,
    updated_at: new Date().toISOString(),
  };

  // Kiểm tra ít nhất 1 sản phẩm có số lượng > 0
  const totalItems =
    payload.tv_qty +
    payload.sofa_qty +
    payload.curtain_qty +
    payload.drying_rack_qty +
    payload.bed_qty +
    payload.refrigerator_qty +
    payload.washing_machine_qty +
    payload.dryer_qty +
    payload.dishwasher_qty;

  if (totalItems <= 0) {
    return { success: false, isUpdate: false, error: 'Vui lòng chọn ít nhất 1 sản phẩm bạn có nhu cầu mua' };
  }

  // Kiểm tra số căn hộ đã tồn tại chưa để thực hiện Upsert an toàn
  const { data: existing, error: findError } = await client
    .from('resident_demands')
    .select('id')
    .ilike('apartment_number', apartment)
    .maybeSingle();

  if (findError) {
    console.error('[Supabase Find Error]', findError);
  }

  if (existing && existing.id) {
    // Cập nhật bản ghi hiện tại
    const { data: updated, error: updateError } = await client
      .from('resident_demands')
      .update(payload)
      .eq('id', existing.id)
      .select('id, zalo_name, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('[Supabase Update Error]', updateError);
      return { success: false, isUpdate: true, error: updateError.message };
    }

    return {
      success: true,
      isUpdate: true,
      data: updated,
    };
  } else {
    // Thêm bản ghi mới
    const { data: inserted, error: insertError } = await client
      .from('resident_demands')
      .insert(payload)
      .select('id, zalo_name, created_at, updated_at')
      .single();

    if (insertError) {
      // Nếu có race condition unique constraint
      if (insertError.code === '23505') {
        const { data: fallbackUpdate, error: fallbackError } = await client
          .from('resident_demands')
          .update(payload)
          .ilike('apartment_number', apartment)
          .select('id, zalo_name, created_at, updated_at')
          .single();

        if (!fallbackError) {
          return { success: true, isUpdate: true, data: fallbackUpdate };
        }
      }
      console.error('[Supabase Insert Error]', insertError);
      return { success: false, isUpdate: false, error: insertError.message };
    }

    return {
      success: true,
      isUpdate: false,
      data: inserted,
    };
  }
}

/**
 * Lấy toàn bộ danh sách chi tiết dành cho Admin (Được bảo vệ bởi xác thực)
 */
export async function getAdminDemands(options?: {
  search?: string;
  productKey?: ProductKey | 'all';
}): Promise<ResidentDemandRecord[]> {
  const client = getSupabaseAdmin();

  let query = client
    .from('resident_demands')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.productKey && options.productKey !== 'all') {
    const product = PRODUCTS.find((p) => p.key === options.productKey);
    if (product) {
      query = query.gt(product.dbField, 0);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase Admin Demands Error]', error);
    throw error;
  }

  let records: ResidentDemandRecord[] = data || [];

  if (options?.search) {
    const searchLower = options.search.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.zalo_name.toLowerCase().includes(searchLower) ||
        r.apartment_number.toLowerCase().includes(searchLower) ||
        (r.phone_number && r.phone_number.toLowerCase().includes(searchLower))
    );
  }

  return records;
}

/**
 * Xóa một bản ghi khảo sát (Dành cho Admin)
 */
export async function deleteDemandRecord(id: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  const { error } = await client.from('resident_demands').delete().eq('id', id);
  if (error) {
    console.error('[Supabase Delete Error]', error);
    throw error;
  }
  return true;
}

/**
 * Cập nhật một bản ghi khảo sát (Dành cho Admin)
 */
export async function updateDemandRecord(id: string, updates: Partial<ResidentDemandRecord>): Promise<ResidentDemandRecord> {
  const client = getSupabaseAdmin();
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  if (payload.apartment_number) {
    payload.apartment_number = normalizeApartment(payload.apartment_number);
  }
  if (payload.zalo_name) {
    payload.zalo_name = sanitizeText(payload.zalo_name);
  }
  if (payload.phone_number && !payload.phone_number.includes('__TEST_')) {
    payload.phone_number = normalizePhoneNumber(payload.phone_number);
  }

  const { data, error } = await client
    .from('resident_demands')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase Update Error]', error);
    throw error;
  }
  return data;
}

/**
 * Dọn dẹp dữ liệu test (Cleanup test records)
 */
export async function cleanupTestDemands(): Promise<number> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('resident_demands')
    .delete()
    .or('zalo_name.ilike.%__TEST%,apartment_number.ilike.%__TEST%,phone_number.ilike.%__TEST%')
    .select();

  if (error) {
    console.error('[Supabase Cleanup Error]', error);
    throw error;
  }

  return (data || []).length;
}
