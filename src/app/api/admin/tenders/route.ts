import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import {
  getAdminTenders,
  createAdminTender,
  cleanupSupplierTestData,
} from '@/lib/supplier-supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenders = await getAdminTenders();
    return NextResponse.json({ success: true, data: tenders }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Tiêu đề đợt chào giá là bắt buộc' }, { status: 400 });
    }

    const tender = await createAdminTender(body);
    return NextResponse.json({ success: true, data: tender }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('cleanup_test') === 'true') {
      const deletedCount = await cleanupSupplierTestData();
      return NextResponse.json({ success: true, deletedCount }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'Missing cleanup parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/admin/tenders DELETE]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
