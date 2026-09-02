import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAdminTenderItems, addAdminTenderItem } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const items = await getAdminTenderItems(id);
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/[id]/items GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.category_key || !body.brand || !body.model_code) {
      return NextResponse.json(
        { success: false, error: 'Nhóm sản phẩm, Thương hiệu và Mã Model là bắt buộc' },
        { status: 400 }
      );
    }

    const item = await addAdminTenderItem({
      ...body,
      tender_id: id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/[id]/items POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
