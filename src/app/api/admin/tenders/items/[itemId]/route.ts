import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { updateAdminTenderItem, deleteAdminTenderItem } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const body = await req.json();
    const updated = await updateAdminTenderItem(itemId, body);
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/items/[itemId] PUT]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    await deleteAdminTenderItem(itemId);
    return NextResponse.json({ success: true, message: 'Đã xóa model' }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/items/[itemId] DELETE]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
