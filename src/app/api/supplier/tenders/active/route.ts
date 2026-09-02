import { NextResponse } from 'next/server';
import { getActivePublicTender } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getActivePublicTender();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/supplier/tenders/active GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải thông tin đợt mời chào giá' },
      { status: 500 }
    );
  }
}
