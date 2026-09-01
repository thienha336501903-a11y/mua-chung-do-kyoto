import { ProductConfig, ProductKey } from '@/types/demand';

export const SITE_NAME = 'Nhu cầu mua sắm cư dân Kyoto';
export const SITE_DESCRIPTION =
  'Cùng tổng hợp nhu cầu để cộng đồng có cơ sở làm việc với nhà phân phối và tìm mức giá tốt hơn cho cư dân.';

export const PRODUCTS: ProductConfig[] = [
  {
    key: 'tv',
    dbField: 'tv_qty',
    name: 'Tivi',
    icon: '📺',
    unit: 'chiếc',
    description: 'Tivi phòng khách, phòng ngủ (Samsung, Sony, LG, Casper...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'sofa',
    dbField: 'sofa_qty',
    name: 'Sofa',
    icon: '🛋️',
    unit: 'bộ',
    description: 'Sofa phòng khách (Sofa da, sofa nỉ, sofa góc chữ L, văng...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'curtain',
    dbField: 'curtain_qty',
    name: 'Rèm',
    icon: '🪟',
    unit: 'bộ',
    description: 'Rèm cửa chính, rèm phòng ngủ (Rèm vải 2 lớp, rèm cuốn, rèm cầu vồng...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'drying_rack',
    dbField: 'drying_rack_qty',
    name: 'Dàn phơi',
    icon: '👕',
    unit: 'bộ',
    description: 'Dàn phơi thông minh ban công / logia (Dàn phơi gắn trần, điện tử, xếp tường...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'bed',
    dbField: 'bed_qty',
    name: 'Giường đóng sẵn',
    icon: '🛏️',
    unit: 'chiếc',
    description: 'Giường ngủ đóng sẵn (Giường master 1m8, giường phụ 1m6, giường tầng trẻ em...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'refrigerator',
    dbField: 'refrigerator_qty',
    name: 'Tủ lạnh',
    icon: '❄️',
    unit: 'chiếc',
    description: 'Tủ lạnh (Side-by-side, 4 cánh, Multi-door từ 300L - 600L+...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'washing_machine',
    dbField: 'washing_machine_qty',
    name: 'Máy giặt',
    icon: '🧺',
    unit: 'chiếc',
    description: 'Máy giặt cửa trước / cửa trên (8.5kg - 12kg+...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'dryer',
    dbField: 'dryer_qty',
    name: 'Máy sấy',
    icon: '♨️',
    unit: 'chiếc',
    description: 'Máy sấy quần áo (Sấy bơm nhiệt Heatpump, ngưng tụ, thông hơi...)',
    defaultQty: 1,
    maxQty: 10,
  },
  {
    key: 'dishwasher',
    dbField: 'dishwasher_qty',
    name: 'Máy rửa bát',
    icon: '🍽️',
    unit: 'chiếc',
    description: 'Máy rửa bát độc lập / âm tủ (12 - 15+ bộ đồ ăn châu Âu...)',
    defaultQty: 1,
    maxQty: 10,
  },
];

export const PRODUCT_MAP: Record<ProductKey, ProductConfig> = PRODUCTS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<ProductKey, ProductConfig>
);

export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kyoto2026@admin';
export const ADMIN_COOKIE_NAME = 'kyoto_admin_session';
