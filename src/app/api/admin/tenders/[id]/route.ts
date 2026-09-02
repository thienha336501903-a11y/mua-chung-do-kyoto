import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { updateAdminTender, deleteAdminTender } from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
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
    const updated = await updateAdminTender(id, body);
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/[id] PUT]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteAdminTender(id);
    return NextResponse.json({ success: true, message: 'Đã xóa đợt chào giá' }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders/[id] DELETE]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
