import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Fuel, CreditCard, User, Clock, Printer } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency, formatVolume, formatDateTime } from '../../utils/cn';

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const res = await api.get<{ data: {
        id: string; invoiceNumber: string; volumeLiters: number; pricePerLiter: number;
        totalAmount: number; paymentMethod: string; customerName: string | null;
        vehicleNumber: string | null; notes: string | null; isVoided: boolean; voidReason: string | null;
        createdAt: string;
        pump: { pumpNumber: string; label: string };
        tank: { name: string; fuelType: string };
        employee: { firstName: string; lastName: string; email: string };
        station: { name: string; address: string };
        fleetAccount: { companyName: string; accountNumber: string } | null;
      } }>(`/sales/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Sale Receipt</h1>
          <p className="text-sm font-mono text-primary">{data.invoiceNumber}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {data.isVoided && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          ⚠️ This sale has been voided. Reason: {data.voidReason}
        </div>
      )}

      {/* Invoice card */}
      <div className="glass-card p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold gradient-text">FUEL RECEIPT</h2>
            <p className="text-muted-foreground text-sm mt-1">{data.station.name}</p>
            <p className="text-muted-foreground text-xs">{data.station.address}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-primary font-semibold">{data.invoiceNumber}</p>
            <p className="text-muted-foreground text-xs mt-1">{formatDateTime(data.createdAt)}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { icon: Fuel, label: 'Fuel Type', value: data.tank.fuelType },
            { icon: Fuel, label: 'Pump', value: `${data.pump.label} (${data.pump.pumpNumber})` },
            { icon: Fuel, label: 'Volume', value: formatVolume(data.volumeLiters) },
            { icon: Fuel, label: 'Price / Liter', value: `₹${data.pricePerLiter.toFixed(2)}` },
            { icon: CreditCard, label: 'Payment', value: data.paymentMethod },
            { icon: User, label: 'Attendant', value: `${data.employee.firstName} ${data.employee.lastName}` },
            ...(data.customerName ? [{ icon: User, label: 'Customer', value: data.customerName }] : []),
            ...(data.vehicleNumber ? [{ icon: User, label: 'Vehicle', value: data.vehicleNumber }] : []),
            ...(data.fleetAccount ? [{ icon: User, label: 'Fleet Account', value: `${data.fleetAccount.companyName} (${data.fleetAccount.accountNumber})` }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-fuel">
          <span className="text-white font-medium">Total Amount</span>
          <span className="text-white text-3xl font-bold">{formatCurrency(data.totalAmount)}</span>
        </div>

        {data.notes && (
          <p className="mt-4 text-sm text-muted-foreground">Notes: {data.notes}</p>
        )}
      </div>
    </div>
  );
}
