export type ProductKey =
  | 'tv'
  | 'sofa'
  | 'curtain'
  | 'drying_rack'
  | 'bed'
  | 'refrigerator'
  | 'washing_machine'
  | 'dryer'
  | 'dishwasher';

export interface ProductConfig {
  key: ProductKey;
  dbField: string;
  name: string;
  icon: string;
  unit: string;
  description: string;
  defaultQty: number;
  maxQty: number;
}

export interface ResidentDemandRecord {
  id: string;
  zalo_name: string;
  apartment_number: string;
  phone_number?: string | null;
  tv_qty: number;
  sofa_qty: number;
  curtain_qty: number;
  drying_rack_qty: number;
  bed_qty: number;
  refrigerator_qty: number;
  washing_machine_qty: number;
  dryer_qty: number;
  dishwasher_qty: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemandFormData {
  zalo_name: string;
  apartment_number: string;
  phone_number: string;
  demands: Record<ProductKey, { selected: boolean; quantity: number }>;
  note?: string;
}

export interface ProductDemandStat {
  key: ProductKey;
  name: string;
  icon: string;
  unit: string;
  total_qty: number;
  households_count: number;
  is_highest: boolean;
}

export interface DemandSummaryData {
  total_households: number;
  products: ProductDemandStat[];
  highest_quantity: number;
  highest_products: string[];
  updated_at: string;
}

export interface SubmitDemandPayload {
  zalo_name: string;
  apartment_number: string;
  phone_number: string;
  tv_qty?: number;
  sofa_qty?: number;
  curtain_qty?: number;
  drying_rack_qty?: number;
  bed_qty?: number;
  refrigerator_qty?: number;
  washing_machine_qty?: number;
  dryer_qty?: number;
  dishwasher_qty?: number;
  note?: string;
}
