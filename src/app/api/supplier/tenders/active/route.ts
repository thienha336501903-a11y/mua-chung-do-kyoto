import { NextRequest, NextResponse } from 'next/server';
import { getActivePublicTender } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetIdOrSlug = searchParams.get('tender_id') || searchParams.get('slug') || undefined;

    const data = await getActivePublicTender(targetIdOrSlug);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/supplier/tenders/active GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải thông tin đợt mời chào giá' },
      { status: 500 }
    );
  }
}
