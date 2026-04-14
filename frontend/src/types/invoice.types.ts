export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue';

export interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
}

export interface BillTo {
  name: string;
  phone?: string;
  address?: string;
}

export interface Dimensions {
  length?: number;
  width?: number;
}

export interface InvoiceItem {
  description: string;
  rate?: number;
  rate_unit?: string;
  quantity?: number;
  dimensions?: Dimensions;
  formula?: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  created_by: string;
  business: BusinessInfo;
  bill_to: BillTo;
  date: string;
  due_date?: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  due: number;
  status: InvoiceStatus;
  pdf_path?: string;
  pdf_generated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  draft_count: number;
  paid_count: number;
  partial_count: number;
  overdue_count: number;
}

export interface CreateInvoicePayload {
  business?: Partial<BusinessInfo>;
  bill_to: BillTo;
  date: string;
  due_date?: string;
  items: InvoiceItem[];
  paid: number;
  notes?: string;
}
