import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoiceApi';
import { formatINR } from '../utils/formatCurrency';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-white rounded-lg border-l-4 p-5 shadow-sm ${color}`}>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery(['stats'], () => invoiceApi.stats(), { enabled: user?.role === 'admin' });
  const { data: recentData } = useQuery(['invoices', 'recent'], () => invoiceApi.list({ limit: 5 }));

  const stats = data?.data?.data;
  const recentInvoices = recentData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <Link to="/invoices/create" className="bg-peach-200 hover:bg-peach-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm border border-peach-300">
          + New Invoice
        </Link>
      </div>

      {user?.role === 'admin' && (
        isLoading ? <Spinner /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Invoices" value={stats?.total_invoices?.toString() || '0'} color="border-blue-400" />
            <StatCard label="Total Amount" value={formatINR(stats?.total_amount || 0)} color="border-peach-400" />
            <StatCard label="Total Paid" value={formatINR(stats?.total_paid || 0)} color="border-green-400" />
            <StatCard label="Total Due" value={formatINR(stats?.total_due || 0)} color="border-red-400" />
          </div>
        )
      )}

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Recent Invoices</h3>
        {recentInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📄</div>
            <p>No invoices yet. <Link to="/invoices/create" className="text-peach-500 hover:underline">Create your first invoice</Link></p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-peach-50 text-gray-600">
                <th className="text-left px-3 py-2">Invoice #</th>
                <th className="text-left px-3 py-2">Customer</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-right px-3 py-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.invoice_number}</Link>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{inv.bill_to?.name}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatINR(inv.total)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">{formatINR(inv.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
