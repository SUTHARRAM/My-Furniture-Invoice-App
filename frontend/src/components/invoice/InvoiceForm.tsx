import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, InvoiceItem, CreateInvoicePayload } from '../../types/invoice.types';
import { invoiceApi } from '../../api/invoiceApi';
import { useUIStore } from '../../store/uiStore';
import { ItemRow } from './ItemRow';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatINR } from '../../utils/formatCurrency';

const defaultItem = (): InvoiceItem => ({ description: '', amount: 0 });

interface Props {
  existing?: Invoice;
}

export function InvoiceForm({ existing }: Props) {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [billToName, setBillToName] = useState(existing?.bill_to.name || '');
  const [billToPhone, setBillToPhone] = useState(existing?.bill_to.phone || '');
  const [billToAddress, setBillToAddress] = useState(existing?.bill_to.address || '');
  const [date, setDate] = useState(existing?.date ? existing.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items || [defaultItem()]);
  const [paid, setPaid] = useState(existing?.paid || 0);
  const [notes, setNotes] = useState(existing?.notes || '');

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const due = total - paid;

  const updateItem = (idx: number, updated: InvoiceItem) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? updated : it)));
  };
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems((prev) => [...prev, defaultItem()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billToName) { addToast('Customer name is required', 'error'); return; }
    if (items.length === 0) { addToast('Add at least one item', 'error'); return; }

    const payload: CreateInvoicePayload = {
      bill_to: { name: billToName, phone: billToPhone, address: billToAddress },
      date: new Date(date).toISOString(),
      items,
      paid,
      notes,
    };

    setLoading(true);
    try {
      if (existing) {
        await invoiceApi.update(existing.id, payload);
        addToast('Invoice updated!');
        navigate(`/invoices/${existing.id}`);
      } else {
        const res = await invoiceApi.create(payload);
        addToast('Invoice created!');
        navigate(`/invoices/${res.data.data.id}`);
      }
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bill To */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 border-b border-peach-100 pb-2">Bill To</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Customer Name *" value={billToName} onChange={(e) => setBillToName(e.target.value)} required />
          <Input label="Phone" value={billToPhone} onChange={(e) => setBillToPhone(e.target.value)} />
          <Input label="Address" value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} />
        </div>
      </div>

      {/* Date */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Invoice Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 border-b border-peach-100 pb-2">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-peach-200 text-gray-700">
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2 w-32">Rate</th>
                <th className="text-left p-2 w-20">Qty</th>
                <th className="text-left p-2 w-28">Amount (₹)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <ItemRow key={idx} item={item} index={idx} onChange={updateItem} onRemove={removeItem} />
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3 text-peach-600" onClick={addItem}>
          + Add Item
        </Button>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="flex gap-8">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold w-28 text-right">{formatINR(total)}</span>
          </div>
          <div className="flex gap-8 items-center">
            <span className="text-gray-500">Paid</span>
            <input
              type="number"
              value={paid}
              min={0}
              max={total}
              onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-peach-300 outline-none"
            />
          </div>
          <div className="flex gap-8 bg-peach-100 px-4 py-2 rounded">
            <span className="font-semibold text-gray-700">Due</span>
            <span className="font-bold text-gray-900 w-28 text-right">{formatINR(due)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-peach-300"
          placeholder="Optional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="submit" loading={loading}>{existing ? 'Update Invoice' : 'Create Invoice'}</Button>
      </div>
    </form>
  );
}
