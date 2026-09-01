import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { deleteDemandRecord, updateDemandRecord } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await updateDemandRecord(id, body);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('[API /api/admin/demands/[id] PATCH]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cập nhật' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    await deleteDemandRecord(id);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bản ghi thành công',
    });
  } catch (error: any) {
    console.error('[API /api/admin/demands/[id] DELETE]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa bản ghi' },
      { status: 500 }
    );
  }
}
