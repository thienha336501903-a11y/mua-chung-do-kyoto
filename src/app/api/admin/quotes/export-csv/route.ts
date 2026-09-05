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
      'Loại hạng mục',
      'Hãng / Thương hiệu',
      'Mã Model / Quy cách',
      'Tên sản phẩm / Hạng mục',
      'Tên phương án',
      'Hình thức tính giá',
      'Giá niêm yết (VNĐ)',
      'Chiết khấu (%)',
      'Giá thực tế / Giá so sánh (VNĐ)',
      'Đơn vị tính',
      'Sẵn hàng / Thi công',
      'SL có thể cấp',
      'Gồm VAT',
      'Free Ship',
      'Gồm Lắp đặt',
      'Gồm Đo đạc / Khảo sát',
      'Bảo hành',
      'Thời gian thi công / Giao',
      'Vải chính (Rèm)',
      'Lớp voan (Rèm)',
      'Quy cách cáp (Lưới AT)',
      'Đường kính cáp (mm)',
      'Khoảng cách dây (cm)',
      'Khung nhôm (Lưới AT)',
      'Tải trọng (kg)',
      'Số thanh phơi',
      'Giá bậc thang theo SL',
      'Link Catalog / Website',
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
      const categoryName =
        q.category_key === 'curtain'
          ? 'Rèm Cửa'
          : q.category_key === 'safety_net'
          ? 'Lưới An Toàn'
          : q.category_key === 'drying_rack'
          ? 'Giàn Phơi'
          : PRODUCTS.find((p) => p.key === q.category_key)?.name || q.category_key;

      const sub = q.submission || {
        company_name: '',
        contact_person: '',
        phone_number: '',
        email: '',
        address_region: '',
      };

      const tierPricingText =
        Array.isArray(q.tier_pricing) && q.tier_pricing.length > 0
          ? q.tier_pricing
              .map(
                (tp) =>
                  `${tp.tier_name || ''} (${tp.min_units || 1}-${tp.max_units || 'nhiều'}): ${formatNumber(tp.unit_price)}₫`
              )
              .join('; ')
          : '';

      return [
        idx + 1,
        escapeCsv(tenderTitle),
        escapeCsv(sub.company_name),
        escapeCsv(sub.contact_person),
        escapeCsv(sub.phone_number),
        escapeCsv(sub.email || ''),
        escapeCsv(sub.address_region || ''),
        escapeCsv(categoryName),
        escapeCsv(q.item_type === 'SERVICE_SPEC' ? 'Dịch vụ thi công' : 'Sản phẩm model'),
        escapeCsv(q.brand),
        escapeCsv(q.model_code),
        escapeCsv(q.product_name || ''),
        escapeCsv(q.plan_name || ''),
        escapeCsv(q.pricing_mode === 'catalog_discount' ? 'Chiết khấu catalog' : 'Giá trực tiếp'),
        q.list_price ? formatNumber(q.list_price) : '',
        q.discount_percent !== null && q.discount_percent !== undefined ? `${q.discount_percent}%` : '',
        formatNumber(Number(q.effective_price || q.unit_price) || 0),
        escapeCsv(q.unit || 'bộ'),
        q.stock_status === 'in_stock' ? 'Sẵn hàng / Sẵn sàng thi công' : q.stock_status === 'pre_order' ? 'Đặt trước' : 'Hết hàng',
        q.available_qty || 0,
        q.is_vat_included ? 'Có' : 'Không',
        q.is_shipping_included ? 'Có' : 'Không',
        q.is_installation_included ? 'Có' : 'Không',
        q.is_survey_included ? 'Có' : 'Không',
        q.warranty_months ? `${q.warranty_months} tháng` : '',
        q.lead_time_days ? `${q.lead_time_days} ngày` : '',
        escapeCsv(q.fabric_main || ''),
        escapeCsv(q.fabric_sheer || ''),
        escapeCsv(q.wire_spec || ''),
        q.wire_diameter_mm ? `${q.wire_diameter_mm}mm` : '',
        q.wire_spacing_cm ? `${q.wire_spacing_cm}cm` : '',
        escapeCsv(q.frame_spec || ''),
        q.load_capacity_kg ? `${q.load_capacity_kg}kg` : '',
        q.drying_bars_count ? `${q.drying_bars_count}` : '',
        escapeCsv(tierPricingText),
        escapeCsv(q.catalog_url || ''),
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
