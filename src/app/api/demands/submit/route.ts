import { NextRequest, NextResponse } from 'next/server';
import { submitResidentDemand } from '@/lib/supabase';
import { SubmitDemandPayload } from '@/types/demand';
import { isValidVietnamesePhone, normalizePhoneNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitDemandPayload;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu gửi lên không đúng định dạng' },
        { status: 400 }
      );
    }

    if (!body.zalo_name || !body.zalo_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Tên Zalo của bạn' },
        { status: 400 }
      );
    }

    if (!body.apartment_number || !body.apartment_number.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Số căn hộ (Ví dụ: K5-1208)' },
        { status: 400 }
      );
    }

    const rawPhone = (body.phone_number || '').trim();
    const isTestPhone = rawPhone.includes('__TEST_');
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    if (!rawPhone || (!isTestPhone && !isValidVietnamesePhone(normalizedPhone))) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập số điện thoại hợp lệ (Ví dụ: 0912 345 678)' },
        { status: 400 }
      );
    }

    const result = await submitResidentDemand(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Lỗi khi lưu khảo sát' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isUpdate: result.isUpdate,
      message: result.isUpdate
        ? 'Đã cập nhật lại nhu cầu của căn hộ bạn ❤️'
        : 'Đã ghi nhận nhu cầu thành công ❤️',
      data: result.data,
    });
  } catch (error: any) {
    console.error('[API /api/demands/submit POST]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống khi gửi nhu cầu' },
      { status: 500 }
    );
  }
}
