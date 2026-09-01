import { ProductDemandStat } from '@/types/demand';

export const PRODUCTION_SITE_URL = 'https://mua-chung-do-kyoto.vercel.app/';

export function generateZaloShareText(
  products: ProductDemandStat[],
  totalHouseholds: number
): string {
  const productLines = products
    .map((p) => `${p.icon} ${p.name}: ${p.total_qty} ${p.unit}`)
    .join('\n');

  const highestItems = products.filter((p) => p.is_highest && p.total_qty > 0);
  let highestText = 'Chưa có ghi nhận';
  if (highestItems.length > 0) {
    highestText = highestItems
      .map((item) => `${item.name} – ${item.total_qty} ${item.unit}`)
      .join(', ');
  }

  return `📊 CẬP NHẬT NHU CẦU MUA SẮM CƯ DÂN KYOTO

👥 Hiện có ${totalHouseholds} hộ đã tham gia khảo sát.

${productLines}

🔥 Nhu cầu cao nhất hiện tại: ${highestText}

👉 Anh/chị cư dân chưa đăng ký có thể cập nhật nhu cầu của mình để cộng đồng có số liệu tổng hợp chính xác hơn khi làm việc với các nhà phân phối/đại lý.

🔗 Đăng ký và xem số liệu mới nhất tại:
${PRODUCTION_SITE_URL}

📌 Đây là khảo sát nhu cầu tự nguyện của cộng đồng cư dân, không phải đơn đặt hàng hay cam kết mua.`;
}
