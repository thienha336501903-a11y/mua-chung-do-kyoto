import { ProductKey } from './demand';

export type TenderStatus = 'draft' | 'open' | 'closed' | 'archived';
export type StockStatus = 'in_stock' | 'pre_order' | 'out_of_stock';
export type TenderItemType = 'PRODUCT_MODEL' | 'SERVICE_SPEC';
export type PricingMode = 'direct' | 'catalog_discount';

export interface SupplierTender {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: TenderStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  items_count?: number;
  quotes_count?: number;
  suppliers_count?: number;
}

export interface SupplierTenderItem {
  id: string;
  tender_id: string;
  category_key: ProductKey | string;
  brand: string;
  model_code: string;
  product_name?: string | null;
  item_type: TenderItemType;
  unit: string;
  reference_qty: number;
  specifications?: string | null;
  spec_definition?: Record<string, any> | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierSubmission {
  id: string;
  tender_id: string;
  company_name: string;
  contact_person: string;
  phone_number: string;
  email?: string | null;
  address_region?: string | null;
  general_note?: string | null;
  is_shortlisted: boolean;
  is_selected_for_contact: boolean;
  admin_private_note?: string | null;
  created_at: string;
  updated_at: string;
  // Nested quotes
  quotes?: SupplierQuoteRecord[];
}

export interface SupplierQuoteRecord {
  id: string;
  submission_id: string;
  tender_item_id?: string | null;
  is_alternative: boolean;
  target_item_id?: string | null;
  item_type?: TenderItemType;
  category_key: ProductKey | string;
  brand: string;
  model_code: string;
  product_name?: string | null;
  plan_name?: string | null;
  unit?: string;
  pricing_mode?: PricingMode;
  list_price?: number | null;
  discount_percent?: number | null;
  effective_price?: number | null;
  unit_price: number;
  stock_status: StockStatus;
  available_qty: number;
  is_vat_included: boolean;
  is_shipping_included: boolean;
  is_installation_included: boolean;
  is_materials_included?: boolean;
  is_survey_included?: boolean;
  min_order_value?: number | null;
  warranty_months?: number | null;
  lead_time_days?: number | null;
  fabric_main?: string | null;
  fabric_sheer?: string | null;
  material?: string | null;
  wire_spec?: string | null;
  wire_diameter_mm?: number | null;
  wire_spacing_cm?: number | null;
  frame_spec?: string | null;
  load_capacity_kg?: number | null;
  drying_bars_count?: number | null;
  catalog_url?: string | null;
  catalog_code?: string | null;
  proposal_reason?: string | null;
  quote_note?: string | null;
  is_shortlisted: boolean;
  is_selected_for_contact: boolean;
  created_at: string;
  // Joined submission info
  submission?: {
    company_name: string;
    contact_person: string;
    phone_number: string;
    email?: string | null;
    address_region?: string | null;
  };
}

export interface SubmitSupplierPayload {
  tender_id: string;
  company_name: string;
  contact_person: string;
  phone_number: string;
  email?: string;
  address_region?: string;
  general_note?: string;
  honeypot?: string; // Bot protection
  quotes: {
    tender_item_id?: string;
    is_alternative?: boolean;
    target_item_id?: string;
    item_type?: TenderItemType;
    category_key: ProductKey | string;
    brand: string;
    model_code: string;
    product_name?: string;
    plan_name?: string;
    unit?: string;
    pricing_mode?: PricingMode;
    list_price?: number;
    discount_percent?: number;
    effective_price?: number;
    unit_price: number;
    stock_status?: StockStatus;
    available_qty?: number;
    is_vat_included?: boolean;
    is_shipping_included?: boolean;
    is_installation_included?: boolean;
    is_materials_included?: boolean;
    is_survey_included?: boolean;
    min_order_value?: number;
    warranty_months?: number;
    lead_time_days?: number;
    fabric_main?: string;
    fabric_sheer?: string;
    material?: string;
    wire_spec?: string;
    wire_diameter_mm?: number;
    wire_spacing_cm?: number;
    frame_spec?: string;
    load_capacity_kg?: number;
    drying_bars_count?: number;
    catalog_url?: string;
    catalog_code?: string;
    proposal_reason?: string;
    quote_note?: string;
  }[];
}

export interface ModelComparisonGroup {
  item: SupplierTenderItem;
  lowest_price: number | null;
  quotes: (SupplierQuoteRecord & { is_lowest: boolean })[];
  alternative_quotes: SupplierQuoteRecord[];
}
