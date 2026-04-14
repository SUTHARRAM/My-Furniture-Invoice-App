import React from 'react';
import { InvoiceItem } from '../../types/invoice.types';
import { calculateAmount } from '../../utils/calculateItem';
import { formatINR } from '../../utils/formatCurrency';

interface Props {
  item: InvoiceItem;
  index: number;
  onChange: (index: number, updated: InvoiceItem) => void;
  onRemove: (index: number) => void;
}

export function ItemRow({ item, index, onChange, onRemove }: Props) {
  const update = (field: keyof InvoiceItem, value: any) => {
    const updated = { ...item, [field]: value };
    // Auto-calculate amount if formula or rate/qty change
    if (field === 'formula' || field === 'rate' || field === 'quantity') {
      const computed = calculateAmount({
        formula: field === 'formula' ? value : updated.formula,
        rate: field === 'rate' ? parseFloat(value) || undefined : updated.rate,
        quantity: field === 'quantity' ? parseFloat(value) || undefined : updated.quantity,
        amount: updated.amount,
      });
      if (!isNaN(computed) && computed > 0) {
        updated.amount = computed;
      }
    }
    onChange(index, updated);
  };

  const computed = calculateAmount({ formula: item.formula, rate: item.rate, quantity: item.quantity, amount: item.amount });

  return (
    <tr className="border-b border-gray-100">
      <td className="p-1">
        <input
          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-peach-300 outline-none"
          value={item.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Item description..."
        />
        {/* Formula field */}
        <input
          className="w-full border border-gray-100 rounded px-2 py-0.5 text-xs text-gray-400 focus:ring-1 focus:ring-peach-200 outline-none mt-0.5"
          value={item.formula || ''}
          onChange={(e) => update('formula', e.target.value)}
          placeholder="Formula e.g. 28 x 2 x 190"
        />
      </td>
      <td className="p-1 w-32">
        <div className="flex gap-1">
          <input
            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-peach-300 outline-none"
            type="number"
            value={item.rate || ''}
            onChange={(e) => update('rate', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Rate"
          />
          <input
            className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 focus:ring-1 focus:ring-peach-200 outline-none"
            value={item.rate_unit || ''}
            onChange={(e) => update('rate_unit', e.target.value)}
            placeholder="unit"
          />
        </div>
      </td>
      <td className="p-1 w-20">
        <input
          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-peach-300 outline-none"
          type="number"
          value={item.quantity || ''}
          onChange={(e) => update('quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="Qty"
        />
      </td>
      <td className="p-1 w-28">
        <input
          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-peach-300 outline-none font-medium"
          type="number"
          value={item.amount}
          onChange={(e) => update('amount', parseFloat(e.target.value) || 0)}
          placeholder="Amount"
        />
        {item.formula && !isNaN(computed) && (
          <div className="text-xs text-peach-500 mt-0.5">{formatINR(computed)}</div>
        )}
      </td>
      <td className="p-1 w-8">
        <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
      </td>
    </tr>
  );
}
