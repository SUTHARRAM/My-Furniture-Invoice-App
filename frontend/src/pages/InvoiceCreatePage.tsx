import React from 'react';
import { InvoiceForm } from '../components/invoice/InvoiceForm';

export function InvoiceCreatePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Invoice</h2>
      <InvoiceForm />
    </div>
  );
}
