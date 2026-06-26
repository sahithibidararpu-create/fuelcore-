import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Fuel, CreditCard, Car, User, FileText, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatCurrency, formatVolume } from '../../utils/cn';

const schema = z.object({
  pumpId: z.string().uuid('Select a pump'),
  volumeLiters: z.number({ invalid_type_error: 'Enter volume' }).positive('Must be positive').max(10000),
  pricePerLiter: z.number({ invalid_type_error: 'Enter price' }).positive('Must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'FLEET', 'MOBILE']),
  fleetAccountId: z.string().optional(),
  customerName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateSalePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [totalAmount, setTotalAmount] = useState(0);

  const { data: pumps } = useQuery({
    queryKey: ['pumps-active'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; pumpNumber: string; label: string; status: string; tank: { name: string; fuelType: string; currentLiters: number } }> }>('/pumps?status=ACTIVE&limit=100');
      return res.data.data;
    },
  });

  const { data: fleetAccounts } = useQuery({
    queryKey: ['fleet-accounts-active'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; companyName: string; accountNumber: string; availableCredit: number }> }>('/fleet/accounts?limit=100');
      return res.data.data;
    },
  });

  const { data: fuelPrices } = useQuery({
    queryKey: ['fuel-prices'],
    queryFn: async () => {
      const res = await api.get<{ data: Record<string, number> }>('/settings/fuel-prices');
      return res.data.data;
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'CASH' },
  });

  const watchPump = watch('pumpId');
  const watchVolume = watch('volumeLiters');
  const watchPrice = watch('pricePerLiter');
  const watchPayment = watch('paymentMethod');

  const selectedPump = pumps?.find((p) => p.id === watchPump);

  // Auto-fill price when pump is selected
  const handlePumpChange = (pumpId: string) => {
    const pump = pumps?.find((p) => p.id === pumpId);
    if (pump && fuelPrices) {
      const price = fuelPrices[pump.tank.fuelType];
      if (price) setValue('pricePerLiter', price);
    }
  };

  // Calculate total
  const vol = Number(watchVolume) || 0;
  const price = Number(watchPrice) || 0;
  const total = vol * price;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/sales', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-active'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      toast.success('Sale created successfully!');
      navigate(`/sales/${data.data.id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to create sale');
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Sale</h1>
          <p className="text-sm text-muted-foreground">Record a fuel dispensing transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        {/* Pump Selection */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Fuel className="w-4 h-4 text-primary" /> Pump & Fuel
          </h2>

          <div>
            <label className="form-label block">Select Pump *</label>
            <select
              {...register('pumpId')}
              onChange={(e) => { register('pumpId').onChange(e); handlePumpChange(e.target.value); }}
              className="form-input w-full"
            >
              <option value="">-- Choose a pump --</option>
              {pumps?.filter((p) => p.status === 'ACTIVE').map((pump) => (
                <option key={pump.id} value={pump.id}>
                  {pump.label} — {pump.tank.fuelType} ({formatVolume(pump.tank.currentLiters)} available)
                </option>
              ))}
            </select>
            {errors.pumpId && <p className="text-red-400 text-xs mt-1">{errors.pumpId.message}</p>}
          </div>

          {selectedPump && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-sm animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Fuel className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedPump.tank.name}</p>
                <p className="text-muted-foreground text-xs">{selectedPump.tank.fuelType} • {formatVolume(selectedPump.tank.currentLiters)} remaining</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label block">Volume (Liters) *</label>
              <input
                {...register('volumeLiters', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="e.g. 50.00"
                className="form-input w-full"
              />
              {errors.volumeLiters && <p className="text-red-400 text-xs mt-1">{errors.volumeLiters.message}</p>}
            </div>
            <div>
              <label className="form-label block">Price per Liter *</label>
              <input
                {...register('pricePerLiter', { valueAsNumber: true })}
                type="number"
                step="0.001"
                placeholder="e.g. 4.15"
                className="form-input w-full"
              />
              {errors.pricePerLiter && <p className="text-red-400 text-xs mt-1">{errors.pricePerLiter.message}</p>}
            </div>
          </div>

          {/* Total preview */}
          {total > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-fuel animate-fade-in">
              <span className="text-white/80 text-sm font-medium">Total Amount</span>
              <span className="text-white text-2xl font-bold">{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Payment
          </h2>

          <div className="grid grid-cols-4 gap-2">
            {(['CASH', 'CARD', 'FLEET', 'MOBILE'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setValue('paymentMethod', method)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  watchPayment === method
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {watchPayment === 'FLEET' && (
            <div className="animate-fade-in">
              <label className="form-label block">Fleet Account *</label>
              <select {...register('fleetAccountId')} className="form-input w-full">
                <option value="">-- Select fleet account --</option>
                {fleetAccounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.companyName} ({acc.accountNumber}) — {formatCurrency(acc.availableCredit)} available
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Customer (Optional)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label block">Customer Name</label>
              <input {...register('customerName')} type="text" placeholder="John Doe" className="form-input w-full" />
            </div>
            <div>
              <label className="form-label block">Vehicle Number</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input {...register('vehicleNumber')} type="text" placeholder="TX-1234" className="form-input w-full pl-9" />
              </div>
            </div>
          </div>
          <div>
            <label className="form-label block">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Additional notes..." className="form-input w-full resize-none" />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Complete Sale {total > 0 && `— ${formatCurrency(total)}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
