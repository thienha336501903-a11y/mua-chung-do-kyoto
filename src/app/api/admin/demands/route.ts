import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { cleanupTestDemands, getAdminDemands } from '@/lib/supabase';
import { ProductKey } from '@/types/demand';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Bạn không có quyền truy cập trang quản trị' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const productKey = (searchParams.get('product') as ProductKey | 'all') || 'all';

    const demands = await getAdminDemands({ search, productKey });

    return NextResponse.json({
      success: true,
      data: demands,
      total: demands.length,
    });
  } catch (error: any) {
    console.error('[API /api/admin/demands GET]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tải danh sách khảo sát' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Bạn không có quyền truy cập trang quản trị' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const cleanupTest = searchParams.get('cleanup_test') === 'true';

    if (cleanupTest) {
      const deletedCount = await cleanupTestDemands();
      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp ${deletedCount} bản ghi kiểm thử`,
        deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Thiếu tham số thực hiện' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API /api/admin/demands DELETE]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa dữ liệu' },
      { status: 500 }
    );
  }
}
