import React from 'react';
import { Input } from '../ui/Input';

interface Props {
  q: string;
  from: string;
  to: string;
  status: string;
  onQChange: (v: string) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
];

export function InvoiceSearch({ q, from, to, status, onQChange, onFromChange, onToChange, onStatusChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex-1 min-w-48">
        <Input
          label="Search"
          placeholder="Invoice # or customer name..."
          value={q}
          onChange={(e) => onQChange(e.target.value)}
        />
      </div>
      <div>
        <Input label="From Date" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div>
        <Input label="To Date" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-peach-300"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
