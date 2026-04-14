import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoiceApi';
import { InvoiceForm } from '../components/invoice/InvoiceForm';
import { Spinner } from '../components/ui/Spinner';

export function InvoiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery(['invoice', id], () => invoiceApi.get(id!));
  const invoice = data?.data?.data;

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!invoice) return <div className="text-center text-gray-400 py-12">Invoice not found</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Invoice — {invoice.invoice_number}</h2>
      <InvoiceForm existing={invoice} />
    </div>
  );
}
