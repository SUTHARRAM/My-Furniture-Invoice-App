import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoiceApi';
import { InvoicePreview } from '../components/invoice/InvoicePreview';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ShareModal } from '../components/share/ShareModal';
import { useUIStore } from '../store/uiStore';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast, openShareModal } = useUIStore();
  const queryClient = useQueryClient();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data, isLoading } = useQuery(['invoice', id], () => invoiceApi.get(id!));
  const invoice = data?.data?.data;

  const handleDownload = async () => {
    if (!id) return;
    setPdfLoading(true);
    try {
      // Generate first (ensures PDF is up to date)
      await invoiceApi.generatePDF(id);
      // Download via authenticated axios request → blob
      const res = await invoiceApi.downloadPDF(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('PDF downloaded!');
    } catch {
      addToast('PDF generation failed', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete invoice ${invoice?.invoice_number}? This cannot be undone.`)) return;
    setDeleteLoading(true);
    try {
      await invoiceApi.delete(id!);
      queryClient.invalidateQueries(['invoices']);
      addToast('Invoice deleted');
      navigate('/invoices');
    } catch {
      addToast('Delete failed', 'error');
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!invoice) return <div className="text-center text-gray-400 py-12">Invoice not found</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">{invoice.invoice_number}</h2>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/invoices/${id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <Button size="sm" loading={pdfLoading} onClick={handleDownload}>⬇ Download PDF</Button>
          <Button size="sm" variant="secondary" onClick={() => openShareModal(id!)}>Share</Button>
          <Button size="sm" variant="danger" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <InvoicePreview invoice={invoice} />
      <ShareModal />
    </div>
  );
}
