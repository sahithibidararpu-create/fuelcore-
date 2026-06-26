import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, DollarSign, Droplets, Zap, AlertTriangle,
  Activity, ArrowUpRight, Fuel, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import api from '../../api/axios';
import { formatCurrency, formatVolume, formatDateTime, formatDate } from '../../utils/cn';
import { cn } from '../../utils/cn';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton h-8 w-32 mb-2 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg, subtitle }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground mb-1 animate-count">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3 text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-semibold text-foreground">
            {p.name === 'revenue' ? formatCurrency(p.value) : formatVolume(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        todayRevenue: number; todayVolume: number; todayTransactions: number;
        revenueChange: number; activePumps: number; totalPumps: number;
        lowStockTanks: number; totalTanks: number;
      } }>('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ date: string; revenue: number; volume: number; transactions: number }> }>('/dashboard/charts');
      return res.data.data;
    },
  });

  const { data: recentSales } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{
        id: string; invoiceNumber: string; totalAmount: number; volumeLiters: number;
        createdAt: string; paymentMethod: string;
        tank: { fuelType: string }; pump: { pumpNumber: string };
        employee: { firstName: string; lastName: string };
      }> }>('/dashboard/recent-sales');
      return res.data.data;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        lowStockTanks: Array<{ id: string; name: string; fuelType: string; currentLiters: number; severity: string; stationName: string }>;
        maintenancePumps: Array<{ id: string; pumpNumber: string; label: string }>;
      } }>('/dashboard/alerts');
      return res.data.data;
    },
  });

  const formattedChartData = chartData?.slice(-30).map((d) => ({
    ...d,
    date: formatDate(d.date, { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue ?? 0)}
              change={stats?.revenueChange}
              icon={DollarSign}
              iconColor="text-indigo-400"
              iconBg="bg-indigo-400/10"
              subtitle="vs. yesterday"
            />
            <StatCard
              title="Fuel Dispensed"
              value={formatVolume(stats?.todayVolume ?? 0)}
              icon={Droplets}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-400/10"
              subtitle={`${stats?.todayTransactions ?? 0} transactions`}
            />
            <StatCard
              title="Active Pumps"
              value={`${stats?.activePumps ?? 0}/${stats?.totalPumps ?? 0}`}
              icon={Zap}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-400/10"
              subtitle="pumps operational"
            />
            <StatCard
              title="Low Stock Tanks"
              value={String(stats?.lowStockTanks ?? 0)}
              icon={AlertTriangle}
              iconColor={stats?.lowStockTanks ? 'text-amber-400' : 'text-emerald-400'}
              iconBg={stats?.lowStockTanks ? 'bg-amber-400/10' : 'bg-emerald-400/10'}
              subtitle={`of ${stats?.totalTanks ?? 0} tanks total`}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Revenue Trend</h2>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>

          {chartLoading ? (
            <div className="skeleton h-56 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={formattedChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revenueGradient)" name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-3">
            {alerts?.lowStockTanks?.length === 0 && alerts?.maintenancePumps?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-foreground">All systems normal</p>
                <p className="text-xs mt-1">No active alerts</p>
              </div>
            ) : (
              <>
                {alerts?.lowStockTanks?.slice(0, 3).map((tank) => (
                  <div key={tank.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    tank.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'
                  )}>
                    <Fuel className={cn('w-4 h-4 mt-0.5 flex-shrink-0', tank.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tank.name}</p>
                      <p className="text-xs text-muted-foreground">{formatVolume(tank.currentLiters)} remaining</p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                      tank.severity === 'CRITICAL' ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10'
                    )}>
                      {tank.severity}
                    </span>
                  </div>
                ))}
                {alerts?.maintenancePumps?.slice(0, 2).map((pump) => (
                  <div key={pump.id} className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                    <Zap className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{pump.label}</p>
                      <p className="text-xs text-muted-foreground">In maintenance</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="glass-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Sales</h2>
          <a href="/sales" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Fuel Type</th>
                <th>Pump</th>
                <th>Volume</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Employee</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {!recentSales ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No sales today
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="cursor-pointer" onClick={() => window.location.href = `/sales/${sale.id}`}>
                    <td className="font-mono text-xs text-primary">{sale.invoiceNumber}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium">
                        {sale.tank.fuelType}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{sale.pump.pumpNumber}</td>
                    <td>{formatVolume(sale.volumeLiters)}</td>
                    <td className="font-semibold text-emerald-400">{formatCurrency(sale.totalAmount)}</td>
                    <td>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        sale.paymentMethod === 'CASH' ? 'text-green-400 bg-green-400/10' :
                        sale.paymentMethod === 'FLEET' ? 'text-blue-400 bg-blue-400/10' :
                        sale.paymentMethod === 'CARD' ? 'text-purple-400 bg-purple-400/10' :
                        'text-cyan-400 bg-cyan-400/10'
                      )}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{sale.employee.firstName} {sale.employee.lastName}</td>
                    <td className="text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
