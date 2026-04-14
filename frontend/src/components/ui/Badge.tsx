import React from 'react';
import { InvoiceStatus } from '../../types/invoice.types';

const statusStyles: Record<InvoiceStatus, string> = {
  draft:         'bg-gray-100 text-gray-700',
  sent:          'bg-blue-100 text-blue-700',
  paid:          'bg-green-100 text-green-700',
  partially_paid:'bg-yellow-100 text-yellow-700',
  overdue:       'bg-red-100 text-red-700',
};

const labels: Record<InvoiceStatus, string> = {
  draft: 'Draft', sent: 'Sent', paid: 'Paid', partially_paid: 'Partial', overdue: 'Overdue',
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
      {labels[status]}
    </span>
  );
}
