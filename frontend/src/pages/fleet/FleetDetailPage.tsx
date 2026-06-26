import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, CreditCard, DollarSign, Car, Plus, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatCurrency, formatDate, formatDateTime, cn } from '../../utils/cn';

export default function FleetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const { data } = useQuery({
    queryKey: ['fleet', id],
    queryFn: async () => {
      const res = await api.get<{ data: {
        id: string; accountNumber: string; companyName: string; contactName: string | null;
        contactPhone: string | null; contactEmail: string | null;
        creditLimit: number; currentBalance: number;
        station: { name: string };
        sales: Array<{ id: string; invoiceNumber: string; totalAmount: number; volumeLiters: number; createdAt: string; tank: { fuelType: string }; pump: { pumpNumber: string } }>;
        payments: Array<{ id: string; amount: number; paymentDate: string; reference: string | null }>;
      } }>(`/fleet/accounts/${id}`);
      return res.data.data;
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/fleet/accounts/${id}/payments`, {
        amount: parseFloat(paymentAmount),
        reference: paymentRef,
        notes: 'Manual payment',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', id] });
      toast.success('Payment recorded');
      setShowPayment(false);
      setPaymentAmount('');
      setPaymentRef('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Payment failed'),
  });

  if (!data) return <div className="skeleton h-64 rounded-xl" />;
  const utilPct = Math.round((data.currentBalance / data.creditLimit) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{data.companyName}</h1>
          <p className="text-sm font-mono text-primary">{data.accountNumber}</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Credit summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Outstanding Balance', value: formatCurrency(data.currentBalance), color: 'text-red-400' },
          { label: 'Available Credit', value: formatCurrency(data.creditLimit - data.currentBalance), color: 'text-emerald-400' },
          { label: 'Credit Limit', value: formatCurrency(data.creditLimit), color: 'text-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5 text-center">
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Credit bar */}
      <div className="glass-card p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Credit Utilization</span>
          <span className="font-semibold text-foreground">{utilPct}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${utilPct}%`, background: utilPct >= 95 ? '#EF4444' : utilPct >= 85 ? '#F59E0B' : '#10B981' }} />
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-5">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label block">Amount *</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0.00" className="form-input w-full" />
              </div>
              <div>
                <label className="form-label block">Reference</label>
                <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                  placeholder="Bank transfer ref, cheque no..." className="form-input w-full" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary">Cancel</button>
                <button onClick={() => paymentMutation.mutate()} disabled={!paymentAmount || paymentMutation.isPending}
                  className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {paymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="glass-card">
        <div className="p-5 border-b border-border font-semibold text-foreground">Sales History</div>
        <table className="w-full data-table">
          <thead className="bg-secondary/30"><tr><th>Invoice</th><th>Fuel</th><th>Volume</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {data.sales.map(s => (
              <tr key={s.id}>
                <td className="font-mono text-xs text-primary">{s.invoiceNumber}</td>
                <td><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{s.tank.fuelType}</span></td>
                <td>{s.volumeLiters.toFixed(1)}L</td>
                <td className="font-semibold text-emerald-400">{formatCurrency(s.totalAmount)}</td>
                <td className="text-muted-foreground text-xs">{formatDateTime(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="glass-card">
        <div className="p-5 border-b border-border font-semibold text-foreground">Payment History</div>
        <table className="w-full data-table">
          <thead className="bg-secondary/30"><tr><th>Amount</th><th>Reference</th><th>Date</th></tr></thead>
          <tbody>
            {data.payments.map(p => (
              <tr key={p.id}>
                <td className="font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                <td className="text-muted-foreground">{p.reference || '–'}</td>
                <td className="text-muted-foreground text-xs">{formatDate(p.paymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
