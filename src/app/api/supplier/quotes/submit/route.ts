import { NextRequest, NextResponse } from 'next/server';
import { submitSupplierQuotes } from '@/lib/supplier-supabase';
import { SubmitSupplierPayload } from '@/types/supplier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: SubmitSupplierPayload = await req.json();

    const result = await submitSupplierQuotes(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Dữ liệu báo giá không hợp lệ' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Đã gửi báo giá thành công. Ban đại diện cư dân Kyoto chân thành cảm ơn Quý Nhà cung cấp!',
        submissionId: result.submissionId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /api/supplier/quotes/submit POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý gửi báo giá từ máy chủ' },
      { status: 500 }
    );
  }
}
