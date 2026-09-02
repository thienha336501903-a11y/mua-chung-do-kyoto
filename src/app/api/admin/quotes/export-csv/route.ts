import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAdminQuotesComparison } from '@/lib/supplier-supabase';
import { formatDateTimeVietnam, formatNumber } from '@/lib/utils';
import { PRODUCTS } from '@/lib/constants';

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

    const headers = [
      'STT',
      'Đợt chào giá',
      'Nhà cung cấp',
      'Người liên hệ',
      'Số điện thoại',
      'Email',
      'Khu vực',
      'Nhóm sản phẩm',
      'Hãng',
      'Mã Model',
      'Tên sản phẩm',
      'Giá chào (VNĐ)',
      'Sẵn hàng',
      'Số lượng có thể cấp',
      'Gồm VAT',
      'Free Ship',
      'Gồm Lắp đặt',
      'Bảo hành (tháng)',
      'Model thay thế?',
      'Lý do đề xuất thay thế',
      'Ghi chú báo giá',
      'Shortlist',
      'Đã chọn liên hệ',
      'Ngày gửi',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const tenderTitle = data.tender?.title || 'Đợt chào giá Kyoto';

    const rows = data.allQuotes.map((q, idx) => {
      const categoryName = PRODUCTS.find((p) => p.key === q.category_key)?.name || q.category_key;
      const sub = q.submission || {
        company_name: '',
        contact_person: '',
        phone_number: '',
        email: '',
        address_region: '',
      };

      return [
        idx + 1,
        escapeCsv(tenderTitle),
        escapeCsv(sub.company_name),
        escapeCsv(sub.contact_person),
        escapeCsv(sub.phone_number),
        escapeCsv(sub.email || ''),
        escapeCsv(sub.address_region || ''),
        escapeCsv(categoryName),
        escapeCsv(q.brand),
        escapeCsv(q.model_code),
        escapeCsv(q.product_name || ''),
        formatNumber(Number(q.unit_price) || 0),
        q.stock_status === 'in_stock' ? 'Sẵn hàng' : q.stock_status === 'pre_order' ? 'Đặt trước' : 'Hết hàng',
        q.available_qty || 0,
        q.is_vat_included ? 'Có' : 'Không',
        q.is_shipping_included ? 'Có' : 'Không',
        q.is_installation_included ? 'Có' : 'Không',
        q.warranty_months ? `${q.warranty_months} tháng` : '',
        q.is_alternative ? 'Đúng' : 'Không',
        escapeCsv(q.proposal_reason || ''),
        escapeCsv(q.quote_note || ''),
        q.is_shortlisted ? 'Có' : '',
        q.is_selected_for_contact ? 'Có' : '',
        escapeCsv(formatDateTimeVietnam(q.created_at)),
      ].join(',');
    });

    const csvString = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const bodyBuffer = Buffer.concat([bom, Buffer.from(csvString, 'utf-8')]);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `Bao_Gia_Nha_Cung_Cap_Kyoto_${dateStr}.csv`;

    return new NextResponse(bodyBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[API /api/admin/quotes/export-csv GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
