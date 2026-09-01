import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAdminDemands } from '@/lib/supabase';
import { PRODUCTS } from '@/lib/constants';
import { formatDateTimeVietnam } from '@/lib/utils';
import { ProductKey } from '@/types/demand';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth(req);
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const productKey = (searchParams.get('product') as ProductKey | 'all') || 'all';

    const records = await getAdminDemands({ search, productKey });

    // CSV Headers
    const headers = [
      'STT',
      'Tên Zalo',
      'Số căn hộ',
      'Số điện thoại',
      ...PRODUCTS.map((p) => `${p.name} (${p.unit})`),
      'Tổng số lượng',
      'Ghi chú',
      'Ngày đăng ký',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r, index) => {
      let totalQty = 0;
      const productValues = PRODUCTS.map((p) => {
        const qty = Number((r as any)[p.dbField]) || 0;
        totalQty += qty;
        return qty;
      });

      return [
        index + 1,
        escapeCsv(r.zalo_name),
        escapeCsv(r.apartment_number),
        escapeCsv(r.phone_number || ''),
        ...productValues,
        totalQty,
        escapeCsv(r.note || ''),
        escapeCsv(formatDateTimeVietnam(r.created_at)),
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) ensures Excel reads Vietnamese diacritics properly
    const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const bodyBuffer = Buffer.concat([bom, Buffer.from(csvString, 'utf-8')]);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `Nhu_Cau_Mua_Sam_Kyoto_${dateStr}.csv`;

    return new NextResponse(bodyBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[API /api/admin/export-csv GET]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xuất file CSV' },
      { status: 500 }
    );
  }
}
