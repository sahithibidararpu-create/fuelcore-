import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, DollarSign, Building2, Save, Loader2, Fuel, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { cn } from '../../utils/cn';

type Tab = 'general' | 'prices' | 'stations';
const FUEL_TYPES = ['DIESEL', 'PETROL', 'PREMIUM', 'KEROSENE'];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const [showAddStation, setShowAddStation] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        station: { id: string; name: string; address: string | null; city: string | null; state: string | null; phone: string | null; email: string | null };
        dieselPrice: number; petrolPrice: number; premiumPrice: number; kerosenePrice: number;
        lowStockThreshold: number; criticalStockThreshold: number;
      } }>('/settings');
      return res.data.data;
    },
  });

  const { data: stations } = useQuery({
    queryKey: ['all-stations'],
    enabled: tab === 'stations',
    queryFn: async () => {
      const res = await api.get<{ data: Array<{
        id: string; name: string; city: string | null; state: string | null; isActive: boolean;
        _count: { tanks: number; pumps: number; employees: number };
      }> }>('/settings/stations');
      return res.data.data;
    },
  });

  const { register: registerStation, handleSubmit: handleStation } = useForm({
    values: {
      name: settings?.station.name ?? '',
      address: settings?.station.address ?? '',
      city: settings?.station.city ?? '',
      state: settings?.station.state ?? '',
      phone: settings?.station.phone ?? '',
      email: settings?.station.email ?? '',
    },
  });

  const { register: registerPrices, handleSubmit: handlePrices } = useForm({
    values: {
      DIESEL: settings?.dieselPrice ?? 0,
      PETROL: settings?.petrolPrice ?? 0,
      PREMIUM: settings?.premiumPrice ?? 0,
      KEROSENE: settings?.kerosenePrice ?? 0,
    },
  });

  const { register: registerNewStation, handleSubmit: handleNewStation, reset: resetNewStation } = useForm({
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
    }
  });

  const stationMutation = useMutation({
    mutationFn: async (data: object) => { await api.patch('/settings/station-profile', data); },
    onSuccess: () => { toast.success('Station profile updated'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
  });

  const priceMutation = useMutation({
    mutationFn: async (prices: object) => { await api.patch('/settings/fuel-prices', { prices }); },
    onSuccess: () => { toast.success('Fuel prices updated'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
  });

  const createStationMutation = useMutation({
    mutationFn: async (data: object) => { await api.post('/settings/stations', data); },
    onSuccess: () => {
      toast.success('Station created successfully');
      queryClient.invalidateQueries({ queryKey: ['all-stations'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddStation(false);
      resetNewStation();
    },
    onError: () => toast.error('Failed to create station'),
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage station configuration and fuel prices</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {[
          { key: 'general', label: 'General', icon: Building2 },
          { key: 'prices', label: 'Fuel Prices', icon: DollarSign },
          { key: 'stations', label: 'All Stations', icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {tab === 'general' && settings && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Station Profile</h2>
          {settings.station.id ? (
            <form onSubmit={handleStation(d => stationMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label block">Station Name *</label>
                  <input {...registerStation('name', { required: true })} className="form-input w-full" />
                </div>
                <div className="col-span-2">
                  <label className="form-label block">Address</label>
                  <input {...registerStation('address')} className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block">City</label>
                  <input {...registerStation('city')} className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block">State</label>
                  <input {...registerStation('state')} className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block">Phone</label>
                  <input {...registerStation('phone')} type="tel" className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block">Email</label>
                  <input {...registerStation('email')} type="email" className="form-input w-full" />
                </div>
              </div>
              <button type="submit" disabled={stationMutation.isPending} className="btn-primary flex items-center gap-2">
                {stationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No station profile loaded. Please configure a station under the "All Stations" tab first.
            </div>
          )}
        </div>
      )}

      {/* Fuel Prices */}
      {tab === 'prices' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Fuel Prices</h2>
          <p className="text-sm text-muted-foreground mb-5">Set price per liter for each fuel type. These are used as defaults when creating new sales.</p>
          {settings?.station.id ? (
            <form onSubmit={handlePrices(d => priceMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {FUEL_TYPES.map(fuel => (
                  <div key={fuel} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Fuel className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground block mb-1">{fuel} (₹/L)</label>
                      <input {...registerPrices(fuel as any, { valueAsNumber: true })} type="number" step="0.001"
                        className="form-input w-full text-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" disabled={priceMutation.isPending} className="btn-primary flex items-center gap-2">
                {priceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Prices
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No station profile loaded. Please configure a station under the "All Stations" tab first.
            </div>
          )}
        </div>
      )}

      {/* All Stations */}
      {tab === 'stations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Station Locations</h2>
            <button onClick={() => setShowAddStation(true)} className="btn-primary flex items-center gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Station
            </button>
          </div>

          <div className="space-y-3">
            {stations?.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">
                No stations configured yet. Click "Add Station" to create your first station.
              </div>
            ) : (
              stations?.map(station => (
                <div key={station.id} className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{station.name}</p>
                    <p className="text-xs text-muted-foreground">{station.city}, {station.state}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{station._count.tanks} tanks</span>
                    <span>{station._count.pumps} pumps</span>
                    <span>{station._count.employees} employees</span>
                    <span className={cn('px-2 py-0.5 rounded-full', station.isActive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
                      {station.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      {showAddStation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-5">Create New Station</h3>
            <form onSubmit={handleNewStation(d => createStationMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="form-label block">Station Name *</label>
                <input {...registerNewStation('name', { required: true })} className="form-input w-full" placeholder="e.g. Texas Star Station" />
              </div>
              <div>
                <label className="form-label block">Address *</label>
                <input {...registerNewStation('address', { required: true })} className="form-input w-full" placeholder="e.g. 100 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block">City *</label>
                  <input {...registerNewStation('city', { required: true })} className="form-input w-full" placeholder="e.g. Dallas" />
                </div>
                <div>
                  <label className="form-label block">State *</label>
                  <input {...registerNewStation('state', { required: true })} className="form-input w-full" placeholder="e.g. TX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block">Phone</label>
                  <input {...registerNewStation('phone')} type="tel" className="form-input w-full" placeholder="e.g. +1-555-0100" />
                </div>
                <div>
                  <label className="form-label block">Email</label>
                  <input {...registerNewStation('email')} type="email" className="form-input w-full" placeholder="e.g. contact@station.com" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStation(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={createStationMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createStationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
