import api from './axiosInstance';
import { Invoice, InvoiceStats, CreateInvoicePayload } from '../types/invoice.types';

export interface InvoiceListParams {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const invoiceApi = {
  list: (params: InvoiceListParams = {}) =>
    api.get<PaginatedResponse<Invoice>>('/invoices', { params }),

  get: (id: string) =>
    api.get<{ data: Invoice }>(`/invoices/${id}`),

  create: (data: CreateInvoicePayload) =>
    api.post<{ data: Invoice }>('/invoices', data),

  update: (id: string, data: Partial<CreateInvoicePayload>) =>
    api.put<{ data: Invoice }>(`/invoices/${id}`, data),

  updatePayment: (id: string, paid: number) =>
    api.patch(`/invoices/${id}/payment`, { paid }),

  delete: (id: string) =>
    api.delete(`/invoices/${id}`),

  stats: () =>
    api.get<{ data: InvoiceStats }>('/invoices/stats'),

  generatePDF: (id: string) =>
    api.post(`/invoices/${id}/pdf/generate`),

  // Authenticated download — returns binary blob with JWT header attached
  downloadPDF: (id: string) =>
    api.get(`/invoices/${id}/pdf/download`, { responseType: 'blob' }),

  shareEmail: (id: string, data: { to: string; subject?: string; message?: string }) =>
    api.post(`/invoices/${id}/share/email`, data),

  shareWhatsApp: (id: string, phone: string) =>
    api.post(`/invoices/${id}/share/whatsapp`, { phone }),
};
