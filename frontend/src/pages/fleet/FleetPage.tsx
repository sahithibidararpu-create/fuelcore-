import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Car, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, cn } from '../../utils/cn';

export default function FleetPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-accounts', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get<{
        data: Array<{
          id: string; accountNumber: string; companyName: string; contactName: string | null;
          contactPhone: string | null; creditLimit: number; currentBalance: number;
          availableCredit: number; utilizationPercent: number;
          _count: { sales: number; payments: number };
          station: { name: string };
        }>;
        meta: { total: number; totalPages: number };
      }>(`/fleet/accounts?${params}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Accounts</h1>
          <p className="text-muted-foreground text-sm">{data?.meta.total ?? '–'} corporate accounts</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search company, account number..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="form-input pl-9 w-full" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.data.map((acc) => {
            const isNearLimit = acc.utilizationPercent >= 85;
            return (
              <Link key={acc.id} to={`/fleet/${acc.id}`} className={cn(
                'glass-card p-5 border hover:-translate-y-0.5 transition-all duration-200 block',
                isNearLimit ? 'border-amber-500/40' : 'border-border'
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{acc.companyName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{acc.accountNumber}</p>
                    </div>
                  </div>
                  {isNearLimit && <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                </div>

                {/* Credit bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Credit Used</span>
                    <span className={cn('font-semibold', isNearLimit ? 'text-amber-400' : 'text-foreground')}>
                      {acc.utilizationPercent}%
                    </span>
                  </div>
                  <div className="tank-bar">
                    <div className="tank-fill" style={{
                      width: `${acc.utilizationPercent}%`,
                      background: acc.utilizationPercent >= 95 ? '#EF4444' : acc.utilizationPercent >= 85 ? '#F59E0B' : '#10B981',
                    }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(acc.currentBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(acc.availableCredit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limit</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(acc.creditLimit)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
