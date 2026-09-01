import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, createAdminToken } from '@/lib/auth';
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_PASSWORD } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!password || password !== correctPassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu quản trị không chính xác' },
        { status: 401 }
      );
    }

    const token = await createAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    return response;
  } catch (error: any) {
    console.error('[API /api/admin/auth POST]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xác thực' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  return NextResponse.json({
    authenticated: isAuth,
  });
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất',
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
