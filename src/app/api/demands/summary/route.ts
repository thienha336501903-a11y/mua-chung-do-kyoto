import { NextResponse } from 'next/server';
import { getPublicDemandSummary } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const summary = await getPublicDemandSummary();

    // Thêm Cache-Control header để đảm bảo dữ liệu real-time nhưng không bị lag
    return NextResponse.json(
      {
        success: true,
        data: summary,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/demands/summary GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể lấy số liệu tổng hợp',
      },
      { status: 500 }
    );
  }
}
