import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAdminQuotesComparison } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenderId = searchParams.get('tender_id') || undefined;

    const data = await getAdminQuotesComparison(tenderId);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/quotes GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
