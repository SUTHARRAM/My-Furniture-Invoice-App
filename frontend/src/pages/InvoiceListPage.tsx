import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoiceApi';
import { InvoiceSearch } from '../components/invoice/InvoiceSearch';
import { InvoiceCard } from '../components/invoice/InvoiceCard';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/Badge';
import { useDebounce } from '../hooks/useDebounce';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { ShareModal } from '../components/share/ShareModal';
import { formatINR } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';

export function InvoiceListPage() {
  const queryClient = useQueryClient();
  const { addToast, openShareModal } = useUIStore();
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const debouncedQ = useDebounce(q, 400);

  const params = { q: debouncedQ, from, to, status, page, limit: 20 };
  const { data, isLoading } = useQuery(['invoices', params], () => invoiceApi.list(params));

  const invoices = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const { user } = useAuthStore();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoiceApi.delete(id);
      addToast('Invoice deleted');
      queryClient.invalidateQueries(['invoices']);
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Invoices</h2>
        <Link to="/invoices/create" className="bg-peach-200 hover:bg-peach-300 text-gray-800 font-semibold px-3 sm:px-4 py-2 rounded-lg text-sm border border-peach-300 whitespace-nowrap">
          + New Invoice
        </Link>
      </div>

      <InvoiceSearch
        q={q} from={from} to={to} status={status}
        onQChange={setQ} onFromChange={setFrom} onToChange={setTo} onStatusChange={setStatus}
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📄</div>
            <p>No invoices found</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/invoices/${inv.id}`} className="font-semibold text-blue-600 text-sm">{inv.invoice_number}</Link>
                      <div className="text-sm text-gray-700 mt-0.5 truncate">{inv.bill_to?.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(inv.date)}</div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm space-x-3">
                      <span className="text-gray-500">Total: <span className="font-medium text-gray-800">{formatINR(inv.total)}</span></span>
                      <span className="text-red-600 font-semibold">Due: {formatINR(inv.due)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Link to={`/invoices/${inv.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    <Link to={`/invoices/${inv.id}/edit`} className="text-xs text-gray-600 hover:underline">Edit</Link>
                    <button onClick={() => openShareModal(inv.id)} className="text-xs text-green-600 hover:underline">Share</button>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-peach-100 text-gray-600 border-b border-peach-200">
                    <th className="text-left px-4 py-3">Invoice #</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Paid</th>
                    <th className="text-left px-4 py-3">Due</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <InvoiceCard key={inv.id} invoice={inv} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-40">‹ Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-40">Next ›</button>
              </div>
            )}
          </>
        )}
      </div>

      <ShareModal />
    </div>
  );
}
