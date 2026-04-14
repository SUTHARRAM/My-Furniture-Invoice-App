import React from 'react';
import { Link } from 'react-router-dom';
import { Invoice } from '../../types/invoice.types';
import { StatusBadge } from '../ui/Badge';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateHelpers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface Props {
  invoice: Invoice;
  onDelete?: (id: string) => void;
}

export function InvoiceCard({ invoice, onDelete }: Props) {
  const { user } = useAuthStore();
  const { openShareModal } = useUIStore();

  return (
    <tr className="hover:bg-peach-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-blue-600">
        <Link to={`/invoices/${invoice.id}`}>{invoice.invoice_number}</Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{invoice.bill_to.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.date)}</td>
      <td className="px-4 py-3 text-sm font-medium">{formatINR(invoice.total)}</td>
      <td className="px-4 py-3 text-sm text-green-600">{formatINR(invoice.paid)}</td>
      <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatINR(invoice.due)}</td>
      <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to={`/invoices/${invoice.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
          <Link to={`/invoices/${invoice.id}/edit`} className="text-xs text-gray-600 hover:underline">Edit</Link>
          <button onClick={() => openShareModal(invoice.id)} className="text-xs text-green-600 hover:underline">Share</button>
          {user?.role === 'admin' && onDelete && (
            <button onClick={() => onDelete(invoice.id)} className="text-xs text-red-500 hover:underline">Delete</button>
          )}
        </div>
      </td>
    </tr>
  );
}
