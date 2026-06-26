import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Eye, Ban, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatVolume, formatDateTime, cn } from '../../utils/cn';

const FUEL_TYPES = ['', 'DIESEL', 'PETROL', 'PREMIUM', 'KEROSENE'];
const PAYMENT_METHODS = ['', 'CASH', 'CARD', 'FLEET', 'MOBILE'];

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search, fuelType, paymentMethod, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (fuelType) params.set('fuelType', fuelType);
      if (paymentMethod) params.set('paymentMethod', paymentMethod);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get<{
        data: Array<{
          id: string; invoiceNumber: string; totalAmount: number; volumeLiters: number; pricePerLiter: number;
          paymentMethod: string; customerName: string | null; vehicleNumber: string | null;
          createdAt: string; isVoided: boolean;
          tank: { fuelType: string }; pump: { pumpNumber: string; label: string };
          employee: { firstName: string; lastName: string };
          fleetAccount: { companyName: string } | null;
        }>;
        meta: { total: number; totalPages: number; page: number };
      }>(`/sales?${params}`);
      return res.data;
    },
  });

  const paymentColor: Record<string, string> = {
    CASH: 'text-green-400 bg-green-400/10',
    CARD: 'text-purple-400 bg-purple-400/10',
    FLEET: 'text-blue-400 bg-blue-400/10',
    MOBILE: 'text-cyan-400 bg-cyan-400/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.meta.total.toLocaleString() ?? '–'} total transactions
          </p>
        </div>
        <Link to="/sales/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Sale
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice, customer, vehicle..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9 w-full"
          />
        </div>
        <select
          value={fuelType}
          onChange={(e) => { setFuelType(e.target.value); setPage(1); }}
          className="form-input w-36"
        >
          {FUEL_TYPES.map((f) => <option key={f} value={f}>{f || 'All Fuels'}</option>)}
        </select>
        <select
          value={paymentMethod}
          onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
          className="form-input w-36"
        >
          {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p || 'All Payments'}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="form-input w-36" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="form-input w-36" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Invoice</th>
                <th>Fuel</th>
                <th>Pump</th>
                <th>Volume</th>
                <th>Price/L</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Customer</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(11).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 opacity-30" />
                      <p>No sales found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.data.map((sale) => (
                  <tr key={sale.id} className={cn(sale.isVoided && 'opacity-50 line-through')}>
                    <td><span className="font-mono text-xs text-primary">{sale.invoiceNumber}</span></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-medium">
                        {sale.tank.fuelType}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{sale.pump.label}</td>
                    <td>{formatVolume(sale.volumeLiters)}</td>
                    <td className="text-muted-foreground">${sale.pricePerLiter.toFixed(2)}</td>
                    <td className="font-semibold text-emerald-400">{formatCurrency(sale.totalAmount)}</td>
                    <td>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', paymentColor[sale.paymentMethod])}>
                        {sale.paymentMethod === 'FLEET' && sale.fleetAccount ? sale.fleetAccount.companyName : sale.paymentMethod}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">{sale.customerName || sale.vehicleNumber || '–'}</td>
                    <td className="text-muted-foreground text-xs">{sale.employee.firstName} {sale.employee.lastName}</td>
                    <td className="text-muted-foreground text-xs">{formatDateTime(sale.createdAt)}</td>
                    <td>
                      <Link to={`/sales/${sale.id}`} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-primary inline-flex">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
