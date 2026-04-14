import React from 'react';
import { Invoice } from '../../types/invoice.types';
import { formatDate } from '../../utils/dateHelpers';
import { formatINR } from '../../utils/formatCurrency';

interface Props { invoice: Invoice; }

export function InvoicePreview({ invoice }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-3xl mx-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-start p-4 sm:p-8 pb-4">
        <div>
          <div className="font-bold text-gray-800 text-base">{invoice.business.name}</div>
          <div className="text-sm text-gray-500">{invoice.business.phone}</div>
          <div className="text-sm text-gray-500">{invoice.business.email}</div>
        </div>
        <div className="text-3xl sm:text-5xl font-bold text-gray-700">Bill</div>
      </div>

      {/* Due Banner */}
      <div className="bg-peach-200 mx-4 sm:mx-8 rounded px-3 sm:px-4 py-2 flex flex-wrap justify-between items-center gap-1 mb-6">
        <span className="font-bold text-gray-800 text-sm sm:text-base">Due Balance &nbsp; {formatINR(invoice.due)}</span>
        <span className="font-medium text-gray-700 text-sm">Date: {formatDate(invoice.date)}</span>
      </div>

      {/* Bill To */}
      <div className="px-4 sm:px-8 mb-6">
        <div className="font-bold text-gray-700 text-sm mb-1">Bill to</div>
        <hr className="border-peach-300 mb-2" />
        <div className="text-gray-700">{invoice.bill_to.name}</div>
        {invoice.bill_to.phone && <div className="text-sm text-gray-500">{invoice.bill_to.phone}</div>}
        {invoice.bill_to.address && <div className="text-sm text-gray-500">{invoice.bill_to.address}</div>}
      </div>

      {/* Items Table */}
      <div className="px-4 sm:px-8 mb-6 overflow-x-auto">
        <table className="w-full text-sm border border-peach-300 min-w-[400px]">
          <thead>
            <tr className="bg-peach-200 text-gray-700">
              <th className="text-left px-3 py-2 border border-peach-300 w-1/2">Description</th>
              <th className="text-center px-3 py-2 border border-peach-300">Rate</th>
              <th className="text-center px-3 py-2 border border-peach-300">Qty</th>
              <th className="text-right px-3 py-2 border border-peach-300">Amount(₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 border border-gray-100">
                  <span className="text-peach-600">• </span>{item.description}
                  {item.formula && (
                    <div className="text-xs text-gray-400 mt-0.5">{item.formula}</div>
                  )}
                </td>
                <td className="px-3 py-2 border border-gray-100 text-center text-gray-500">
                  {item.rate ? `${item.rate} ${item.rate_unit || ''}` : '-'}
                </td>
                <td className="px-3 py-2 border border-gray-100 text-center text-gray-500">
                  {item.quantity ?? '-'}
                </td>
                <td className="px-3 py-2 border border-gray-100 text-right font-medium">
                  {formatINR(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Totals */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8">
        <table className="w-full sm:w-3/5 text-sm ml-auto">
          <tbody>
            <tr className="border border-gray-200">
              <td className="px-4 py-2 text-right text-gray-600 font-semibold border border-gray-200">Total</td>
              <td className="px-4 py-2 text-right font-semibold border border-gray-200">{formatINR(invoice.total)}</td>
            </tr>
            <tr className="border border-gray-200">
              <td className="px-4 py-2 text-right text-gray-600 font-semibold border border-gray-200">Paid</td>
              <td className="px-4 py-2 text-right font-semibold border border-gray-200">{formatINR(invoice.paid)}</td>
            </tr>
            <tr className="bg-peach-100 border border-peach-200">
              <td className="px-4 py-2 text-right text-gray-700 font-bold border border-peach-200">Due</td>
              <td className="px-4 py-2 text-right font-bold text-gray-800 border border-peach-200">{formatINR(invoice.due)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
