import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap, AlertTriangle, Settings, Wrench, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatVolume, cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  INACTIVE: { bg: 'border-slate-500/30 bg-slate-500/5', text: 'text-slate-400', dot: 'bg-slate-400' },
  MAINTENANCE: { bg: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400', dot: 'bg-amber-400' },
};

interface PumpFormValues {
  pumpNumber: string;
  label: string;
  tankId: string;
  stationId: string;
  openingMeter: number;
}

export default function PumpsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showAddPump, setShowAddPump] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pumps'],
    queryFn: async () => {
      const res = await api.get<{
        data: Array<{
          id: string; pumpNumber: string; label: string; status: string;
          currentMeter: number; openingMeter: number; lastServiced: string | null;
          tank: { name: string; fuelType: string; currentLiters: number; capacityLiters: number };
          station: { name: string };
          _count: { sales: number };
        }>;
        meta: { total: number };
      }>('/pumps?limit=100');
      return res.data;
    },
  });

  const { data: statusSummary } = useQuery({
    queryKey: ['pumps-status'],
    queryFn: async () => {
      const res = await api.get<{ data: Record<string, number> }>('/pumps/status');
      return res.data.data;
    },
  });

  // Queries for the form
  const { data: stations } = useQuery({
    queryKey: ['settings-stations-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string }> }>('/settings/stations');
      return res.data.data;
    },
    enabled: user?.role === 'SUPER_ADMIN' && showAddPump,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<{ data: { station: { id: string; name: string } } }>('/settings');
      return res.data.data;
    },
    enabled: user?.role === 'STATION_MANAGER' && showAddPump,
  });

  const { data: tanks } = useQuery({
    queryKey: ['tanks-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string; fuelType: string; stationId: string }> }>('/inventory/tanks?limit=100');
      return res.data.data;
    },
    enabled: showAddPump,
  });

  const { register: registerPump, handleSubmit: handleSubmitPump, reset: resetPump, watch, setValue } = useForm<PumpFormValues>({
    defaultValues: {
      pumpNumber: '',
      label: '',
      tankId: '',
      stationId: user?.stationId || '',
      openingMeter: 0,
    }
  });

  const selectedStationId = watch('stationId');

  useEffect(() => {
    if (showAddPump) {
      resetPump({
        pumpNumber: '',
        label: '',
        tankId: '',
        stationId: user?.stationId || '',
        openingMeter: 0,
      });
    }
  }, [showAddPump, user, resetPump]);

  // If station changes, reset the tank selection
  useEffect(() => {
    setValue('tankId', '');
  }, [selectedStationId, setValue]);
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/pumps/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-status'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-active'] });
      toast.success('Pump status updated');
    },
    onError: () => toast.error('Failed to update pump status'),
  });

  const createPumpMutation = useMutation({
    mutationFn: async (data: PumpFormValues) => {
      await api.post('/pumps', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-status'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-active'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      toast.success('Pump added successfully');
      setShowAddPump(false);
      resetPump();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to add pump';
      toast.error(message);
    }
  });

  const pumps = data?.data ?? [];
  const filteredTanks = tanks?.filter(t => t.stationId === selectedStationId) ?? [];
  const stationName = settings?.station.name || 'Your Station';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pump Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.meta.total ?? '–'} pumps across all stations</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'STATION_MANAGER') && (
          <button onClick={() => setShowAddPump(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Pump
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', key: 'ACTIVE', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Zap },
          { label: 'Inactive', key: 'INACTIVE', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Zap },
          { label: 'Maintenance', key: 'MAINTENANCE', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Wrench },
        ].map(({ label, key, color, bg, icon: Icon }) => (
          <div key={key} className="glass-card-hover p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-6 h-6', color)} />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{statusSummary?.[key] ?? 0}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pump Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pumps.map((pump) => {
            const statusStyle = STATUS_COLORS[pump.status];
            const tankPct = Math.round((pump.tank.currentLiters / pump.tank.capacityLiters) * 100);
            return (
              <div key={pump.id} className={cn('glass-card p-5 border transition-all duration-300 hover:-translate-y-0.5', statusStyle.bg)}>
                {/* Pump header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', pump.status === 'ACTIVE' ? 'bg-emerald-400/10' : pump.status === 'MAINTENANCE' ? 'bg-amber-400/10' : 'bg-slate-400/10')}>
                      <Zap className={cn('w-4 h-4', statusStyle.text)} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{pump.label}</p>
                      <p className="text-[10px] text-muted-foreground">{pump.station.name}</p>
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full', statusStyle.text, 'bg-current/10')}>
                    <div className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot, pump.status === 'ACTIVE' && 'animate-pulse')} />
                    {pump.status}
                  </div>
                </div>

                {/* Tank info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">{pump.tank.name}</span>
                    <span className="font-medium text-foreground">{pump.tank.fuelType}</span>
                  </div>
                  <div className="tank-bar mb-1">
                    <div
                      className="tank-fill"
                      style={{
                        width: `${tankPct}%`,
                        background: tankPct <= 20 ? '#EF4444' : tankPct <= 40 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatVolume(pump.tank.currentLiters)}</span>
                    <span>{tankPct}%</span>
                  </div>
                </div>

                {/* Meter reading */}
                <div className="text-xs text-muted-foreground mb-4">
                  <span className="font-mono">{pump.currentMeter.toFixed(1)}L</span> meter reading
                </div>

                {/* Status toggle */}
                <div className="flex gap-1.5">
                  {(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate({ id: pump.id, status: s })}
                      disabled={pump.status === s || updateStatus.isPending}
                      className={cn(
                        'flex-1 py-1.5 text-[10px] font-semibold rounded border transition-all',
                        pump.status === s
                          ? `${STATUS_COLORS[s].text} border-current bg-current/10`
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {s === 'MAINTENANCE' ? 'MAINT.' : s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Pump Modal */}
      {showAddPump && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in relative">
            <h3 className="text-lg font-bold text-foreground mb-5">Add New Pump</h3>
            <form onSubmit={handleSubmitPump(d => createPumpMutation.mutate({ ...d, openingMeter: Number(d.openingMeter) }))} className="space-y-4">
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Pump Number *</label>
                <input {...registerPump('pumpNumber', { required: true })} className="form-input w-full" placeholder="e.g. P05" />
              </div>
              
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Label *</label>
                <input {...registerPump('label', { required: true })} className="form-input w-full" placeholder="e.g. Pump 5" />
              </div>

              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Opening Meter Reading (L) *</label>
                <input {...registerPump('openingMeter', { required: true, valueAsNumber: true })} type="number" step="0.1" className="form-input w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Assigned Station *</label>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <select {...registerPump('stationId', { required: true })} className="form-input w-full bg-background text-foreground">
                      <option value="">-- Select --</option>
                      {stations?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div>
                      <input type="text" readOnly value={stationName} className="form-input w-full opacity-60 cursor-not-allowed bg-secondary/20" />
                      <input type="hidden" {...registerPump('stationId')} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Assigned Fuel Tank *</label>
                  <select {...registerPump('tankId', { required: true })} className="form-input w-full bg-background text-foreground">
                    <option value="">-- Select --</option>
                    {filteredTanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.fuelType})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setShowAddPump(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createPumpMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createPumpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
