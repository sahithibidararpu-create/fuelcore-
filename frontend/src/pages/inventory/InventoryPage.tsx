import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Droplets, RefreshCw, Truck, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatVolume, formatCurrency, formatDate, cn, getTankStatusColor } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

type Tab = 'tanks' | 'refills' | 'suppliers';

interface TankFormValues {
  name: string;
  fuelType: 'DIESEL' | 'PETROL' | 'PREMIUM' | 'KEROSENE';
  capacityLiters: number;
  currentLiters: number;
  minThreshold: number;
  stationId: string;
}

interface RefillFormValues {
  tankId: string;
  stationId: string;
  volumeLiters: number;
  pricePerLiter: number;
  supplierId: string;
  deliveryDate: string;
  invoiceNumber?: string;
  notes?: string;
}

interface SupplierFormValues {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('tanks');
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddRefill, setShowAddRefill] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Primary page queries
  const { data: summary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        totalTanks: number; lowStockCount: number;
        byFuelType: Record<string, { capacity: number; current: number; tanks: number }>;
        tanks: Array<{ id: string; name: string; fuelType: string; currentLiters: number; capacityLiters: number; percentFull: number; stationName: string }>;
      } }>('/inventory/summary');
      return res.data.data;
    },
  });

  const { data: refills } = useQuery({
    queryKey: ['refills'],
    enabled: tab === 'refills',
    queryFn: async () => {
      const res = await api.get<{ data: Array<{
        id: string; volumeLiters: number; pricePerLiter: number; totalCost: number; deliveryDate: string; invoiceNumber: string | null;
        tank: { name: string; fuelType: string }; supplier: { name: string }; station: { name: string };
      }> }>('/inventory/refills?limit=50');
      return res.data.data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    enabled: tab === 'suppliers',
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string; contactName: string | null; phone: string | null; email: string | null }> }>('/inventory/suppliers?limit=100');
      return res.data.data;
    },
  });

  // Modal support queries
  const { data: stations } = useQuery({
    queryKey: ['settings-stations-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string }> }>('/settings/stations');
      return res.data.data;
    },
    enabled: user?.role === 'SUPER_ADMIN' && (showAddTank || showAddRefill),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<{ data: { station: { id: string; name: string } } }>('/settings');
      return res.data.data;
    },
    enabled: user?.role === 'STATION_MANAGER' && (showAddTank || showAddRefill),
  });

  const { data: tanksList } = useQuery({
    queryKey: ['tanks-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string; fuelType: string; stationId: string }> }>('/inventory/tanks?limit=100');
      return res.data.data;
    },
    enabled: showAddRefill,
  });

  const { data: suppliersList } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string }> }>('/inventory/suppliers?limit=100');
      return res.data.data;
    },
    enabled: showAddRefill,
  });

  // 1. Add Tank Form
  const { register: registerTank, handleSubmit: handleSubmitTank, reset: resetTank } = useForm<TankFormValues>({
    defaultValues: {
      name: '',
      fuelType: 'DIESEL',
      capacityLiters: 15000,
      currentLiters: 10000,
      minThreshold: 1500,
      stationId: user?.stationId || '',
    }
  });

  // 2. Record Refill Form
  const { register: registerRefill, handleSubmit: handleSubmitRefill, reset: resetRefill, watch: watchRefill, setValue: setRefillValue } = useForm<RefillFormValues>({
    defaultValues: {
      tankId: '',
      stationId: user?.stationId || '',
      volumeLiters: 5000,
      pricePerLiter: 3.20,
      supplierId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      notes: '',
    }
  });

  const selectedRefillStationId = watchRefill('stationId');

  // 3. Add Supplier Form
  const { register: registerSupplier, handleSubmit: handleSubmitSupplier, reset: resetSupplier } = useForm<SupplierFormValues>({
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
    }
  });

  // Form open/close resets
  useEffect(() => {
    if (showAddTank) {
      resetTank({
        name: '',
        fuelType: 'DIESEL',
        capacityLiters: 15000,
        currentLiters: 10000,
        minThreshold: 1500,
        stationId: user?.stationId || '',
      });
    }
  }, [showAddTank, user, resetTank]);

  useEffect(() => {
    if (showAddRefill) {
      resetRefill({
        tankId: '',
        stationId: user?.stationId || '',
        volumeLiters: 5000,
        pricePerLiter: 3.20,
        supplierId: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: '',
      });
    }
  }, [showAddRefill, user, resetRefill]);

  useEffect(() => {
    setRefillValue('tankId', '');
  }, [selectedRefillStationId, setRefillValue]);

  useEffect(() => {
    if (showAddSupplier) {
      resetSupplier({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
      });
    }
  }, [showAddSupplier, resetSupplier]);

  const createTankMutation = useMutation({
    mutationFn: async (data: TankFormValues) => {
      await api.post('/inventory/tanks', {
        ...data,
        capacityLiters: Number(data.capacityLiters),
        currentLiters: Number(data.currentLiters),
        minThreshold: Number(data.minThreshold),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['tanks-list'] });
      toast.success('Fuel tank added successfully');
      setShowAddTank(false);
      resetTank();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to add fuel tank';
      toast.error(message);
    }
  });

  const createRefillMutation = useMutation({
    mutationFn: async (data: RefillFormValues) => {
      await api.post('/inventory/refills', {
        ...data,
        volumeLiters: Number(data.volumeLiters),
        pricePerLiter: Number(data.pricePerLiter),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['refills'] });
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      queryClient.invalidateQueries({ queryKey: ['pumps-active'] });
      toast.success('Refill recorded successfully');
      setShowAddRefill(false);
      resetRefill();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to record refill';
      toast.error(message);
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      await api.post('/inventory/suppliers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      toast.success('Supplier added successfully');
      setShowAddSupplier(false);
      resetSupplier();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to add supplier';
      toast.error(message);
    }
  });

  const stationName = settings?.station.name || 'Your Station';
  const filteredTanks = tanksList?.filter(t => t.stationId === selectedRefillStationId) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm">{summary?.totalTanks ?? 0} tanks · {summary?.lowStockCount ?? 0} low stock</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'STATION_MANAGER') && (
          <div>
            {tab === 'tanks' && (
              <button onClick={() => setShowAddTank(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Tank
              </button>
            )}
            {tab === 'refills' && (
              <button onClick={() => setShowAddRefill(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Record Refill
              </button>
            )}
            {tab === 'suppliers' && (
              <button onClick={() => setShowAddSupplier(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Supplier
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fuel Type Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(summary?.byFuelType ?? {}).map(([type, data]) => {
          const pct = Math.round((data.current / data.capacity) * 100) || 0;
          return (
            <div key={type} className="glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{type}</span>
                <span className="text-xs text-muted-foreground">{data.tanks} tanks</span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{formatVolume(data.current)}</p>
              <div className="tank-bar mb-1">
                <div className="tank-fill" style={{ width: `${pct}%`, background: getTankStatusColor(pct) }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{pct}% full</span>
                <span>{formatVolume(data.capacity)} cap.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {[
          { key: 'tanks', label: 'Fuel Tanks', icon: Package },
          { key: 'refills', label: 'Refill History', icon: RefreshCw },
          { key: 'suppliers', label: 'Suppliers', icon: Truck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tanks Tab */}
      {tab === 'tanks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summary?.tanks.length === 0 ? (
            <div className="col-span-full glass-card p-8 text-center text-muted-foreground">
              No fuel tanks configured yet. Click "Add Tank" to create your first fuel tank.
            </div>
          ) : (
            summary?.tanks.map((tank) => (
              <div key={tank.id} className={cn('glass-card p-5 border transition-all hover:-translate-y-0.5',
                tank.percentFull <= 20 ? 'border-red-500/30' : tank.percentFull <= 35 ? 'border-amber-500/30' : 'border-border'
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">{tank.name}</p>
                    <p className="text-xs text-muted-foreground">{tank.stationName}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary font-medium">{tank.fuelType}</span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Current Level</span>
                    <span style={{ color: getTankStatusColor(tank.percentFull) }} className="font-semibold">
                      {tank.percentFull}%
                    </span>
                  </div>
                  <div className="tank-bar">
                    <div className="tank-fill" style={{ width: `${tank.percentFull}%`, background: getTankStatusColor(tank.percentFull) }} />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{formatVolume(tank.currentLiters)}</span>
                  <span className="text-muted-foreground">/ {formatVolume(tank.capacityLiters)}</span>
                </div>

                {tank.percentFull <= 20 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg p-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical – schedule refill
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Refills Tab */}
      {tab === 'refills' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead className="bg-secondary/30">
                <tr>
                  <th>Tank</th>
                  <th>Fuel Type</th>
                  <th>Volume</th>
                  <th>Price/L</th>
                  <th>Total Cost</th>
                  <th>Supplier</th>
                  <th>Station</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {refills?.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted-foreground py-4">No refill records found</td></tr>
                ) : (
                  refills?.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.tank.name}</td>
                      <td><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{r.tank.fuelType}</span></td>
                      <td>{formatVolume(r.volumeLiters)}</td>
                      <td className="text-muted-foreground">₹{r.pricePerLiter.toFixed(2)}</td>
                      <td className="font-semibold text-emerald-400">{formatCurrency(r.totalCost)}</td>
                      <td className="text-muted-foreground">{r.supplier.name}</td>
                      <td className="text-muted-foreground">{r.station.name}</td>
                      <td className="text-muted-foreground">{formatDate(r.deliveryDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers?.length === 0 ? (
            <div className="col-span-full glass-card p-8 text-center text-muted-foreground">No suppliers configured yet</div>
          ) : (
            suppliers?.map((s) => (
              <div key={s.id} className="glass-card-hover p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{s.name}</p>
                    {s.contactName && <p className="text-xs text-muted-foreground">{s.contactName}</p>}
                  </div>
                </div>
                {s.phone && <p className="text-sm text-muted-foreground">📞 {s.phone}</p>}
                {s.email && <p className="text-sm text-muted-foreground">✉️ {s.email}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Tank Modal */}
      {showAddTank && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in relative">
            <h3 className="text-lg font-bold text-foreground mb-5">Add New Fuel Tank</h3>
            <form onSubmit={handleSubmitTank(d => createTankMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Tank Name *</label>
                <input {...registerTank('name', { required: true })} className="form-input w-full" placeholder="e.g. Tank A - Premium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Fuel Type *</label>
                  <select {...registerTank('fuelType', { required: true })} className="form-input w-full bg-background text-foreground">
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="PREMIUM">Premium Petrol</option>
                    <option value="KEROSENE">Kerosene</option>
                  </select>
                </div>

                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Assigned Station *</label>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <select {...registerTank('stationId', { required: true })} className="form-input w-full bg-background text-foreground">
                      <option value="">-- Select --</option>
                      {stations?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div>
                      <input type="text" readOnly value={stationName} className="form-input w-full opacity-60 cursor-not-allowed bg-secondary/20" />
                      <input type="hidden" {...registerTank('stationId')} />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="form-label block text-[10px] font-semibold uppercase tracking-wider mb-1">Capacity (L) *</label>
                  <input {...registerTank('capacityLiters', { required: true, valueAsNumber: true })} type="number" className="form-input w-full text-xs" />
                </div>
                <div>
                  <label className="form-label block text-[10px] font-semibold uppercase tracking-wider mb-1">Current (L) *</label>
                  <input {...registerTank('currentLiters', { required: true, valueAsNumber: true })} type="number" className="form-input w-full text-xs" />
                </div>
                <div>
                  <label className="form-label block text-[10px] font-semibold uppercase tracking-wider mb-1">Min Threshold *</label>
                  <input {...registerTank('minThreshold', { required: true, valueAsNumber: true })} type="number" className="form-input w-full text-xs" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setShowAddTank(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createTankMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createTankMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Refill Modal */}
      {showAddRefill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in relative max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-5">Record Fuel Refill</h3>
            <form onSubmit={handleSubmitRefill(d => createRefillMutation.mutate(d))} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Station *</label>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <select {...registerRefill('stationId', { required: true })} className="form-input w-full bg-background text-foreground">
                      <option value="">-- Select --</option>
                      {stations?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div>
                      <input type="text" readOnly value={stationName} className="form-input w-full opacity-60 cursor-not-allowed bg-secondary/20" />
                      <input type="hidden" {...registerRefill('stationId')} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Fuel Tank *</label>
                  <select {...registerRefill('tankId', { required: true })} className="form-input w-full bg-background text-foreground">
                    <option value="">-- Select --</option>
                    {filteredTanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.fuelType})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Volume (Liters) *</label>
                  <input {...registerRefill('volumeLiters', { required: true, valueAsNumber: true })} type="number" step="1" className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Price Per Liter (₹) *</label>
                  <input {...registerRefill('pricePerLiter', { required: true, valueAsNumber: true })} type="number" step="0.001" className="form-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Supplier *</label>
                  <select {...registerRefill('supplierId', { required: true })} className="form-input w-full bg-background text-foreground">
                    <option value="">-- Select --</option>
                    {suppliersList?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Delivery Date *</label>
                  <input {...registerRefill('deliveryDate', { required: true })} type="date" className="form-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Invoice Number</label>
                  <input {...registerRefill('invoiceNumber')} type="text" className="form-input w-full" placeholder="e.g. INV-90234" />
                </div>
              </div>

              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Notes</label>
                <textarea {...registerRefill('notes')} rows={2} className="form-input w-full resize-none" placeholder="Add details..." />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setShowAddRefill(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createRefillMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createRefillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in relative">
            <h3 className="text-lg font-bold text-foreground mb-5">Add Fuel Supplier</h3>
            <form onSubmit={handleSubmitSupplier(d => createSupplierMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Supplier Name *</label>
                <input {...registerSupplier('name', { required: true })} type="text" className="form-input w-full" placeholder="e.g. PetroSupply Inc." />
              </div>
              
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Contact Person</label>
                <input {...registerSupplier('contactName')} type="text" className="form-input w-full" placeholder="e.g. Alice Brown" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Phone</label>
                  <input {...registerSupplier('phone')} type="tel" className="form-input w-full" placeholder="e.g. +1-555-0199" />
                </div>
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
                  <input {...registerSupplier('email')} type="email" className="form-input w-full" placeholder="e.g. vendor@petrosupply.com" />
                </div>
              </div>

              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Address</label>
                <input {...registerSupplier('address')} type="text" className="form-input w-full" placeholder="e.g. 500 Industrial Pkwy" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setShowAddSupplier(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createSupplierMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createSupplierMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
