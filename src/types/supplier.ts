import { ProductKey } from './demand';

export type TenderStatus = 'draft' | 'open' | 'closed' | 'archived';
export type StockStatus = 'in_stock' | 'pre_order' | 'out_of_stock';

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
  category_key: ProductKey;
  brand: string;
  model_code: string;
  product_name?: string | null;
  reference_qty: number;
  specifications?: string | null;
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
  category_key: ProductKey;
  brand: string;
  model_code: string;
  product_name?: string | null;
  unit_price: number;
  stock_status: StockStatus;
  available_qty: number;
  is_vat_included: boolean;
  is_shipping_included: boolean;
  is_installation_included: boolean;
  warranty_months?: number | null;
  lead_time_days?: number | null;
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
    category_key: ProductKey;
    brand: string;
    model_code: string;
    product_name?: string;
    unit_price: number;
    stock_status?: StockStatus;
    available_qty?: number;
    is_vat_included?: boolean;
    is_shipping_included?: boolean;
    is_installation_included?: boolean;
    warranty_months?: number;
    lead_time_days?: number;
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
