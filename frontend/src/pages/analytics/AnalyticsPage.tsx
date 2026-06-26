import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import api from '../../api/axios';
import { formatCurrency, formatDate, cn } from '../../utils/cn';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#06B6D4'];

export default function AnalyticsPage() {
  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ date: string; revenue: number; volume: number; transactions: number }> }>('/analytics/revenue-trends?days=30');
      return res.data.data;
    },
  });

  const { data: fuelMix } = useQuery({
    queryKey: ['analytics-fuel-mix'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ fuelType: string; volume: number; revenue: number; transactions: number }> }>('/analytics/fuel-mix');
      return res.data.data;
    },
  });

  const { data: forecast } = useQuery({
    queryKey: ['analytics-forecast'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ date: string; volume: number; movingAvg: number; isForecast?: boolean }> }>('/analytics/demand-forecast');
      return res.data.data;
    },
  });

  const { data: recommendations } = useQuery({
    queryKey: ['analytics-recommendations'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ type: string; title: string; description: string; priority: string }> }>('/analytics/recommendations');
      return res.data.data;
    },
  });

  const totalRevenue = trends?.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalTransactions = trends?.reduce((s, d) => s + d.transactions, 0) ?? 0;

  const priorityColor: Record<string, string> = {
    CRITICAL: 'border-red-500/40 bg-red-500/5 text-red-400',
    HIGH: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    MEDIUM: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
    LOW: 'border-slate-500/30 bg-slate-500/5 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Business intelligence and demand forecasting</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-muted-foreground text-sm mb-2">30-Day Revenue</p>
          <p className="text-3xl font-bold gradient-text">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-muted-foreground text-sm mb-2">Transactions</p>
          <p className="text-3xl font-bold gradient-text">{totalTransactions.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Fuel Mix */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Fuel Mix (30 days)</h2>
          {fuelMix && (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={fuelMix} dataKey="revenue" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {fuelMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {fuelMix.map((f, i) => {
                  const total = fuelMix.reduce((s, d) => s + d.revenue, 0);
                  const pct = total > 0 ? ((f.revenue / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={f.fuelType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-foreground">{f.fuelType}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{pct}%</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(f.revenue)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Demand Forecast */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Demand Forecast</h2>
          <p className="text-xs text-muted-foreground mb-5">7-day moving average + forecast</p>
          {forecast && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecast.slice(-37)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.slice(5)} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(0)}L`, 'Volume']} />
                <Line type="monotone" dataKey="movingAvg" stroke="#4F46E5" strokeWidth={2} dot={false} name="Moving Avg" />
                <Line type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={1} dot={false} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Smart Recommendations</h2>
          <p className="text-xs text-muted-foreground">AI-driven insights for your operations</p>
        </div>
        <div className="p-5 space-y-3">
          {!recommendations || recommendations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">🎉 No issues detected — all systems optimal!</p>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className={cn('flex items-start gap-3 p-4 rounded-xl border', priorityColor[rec.priority])}>
                <div className="mt-0.5">
                  {rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟠' : rec.priority === 'MEDIUM' ? '🔵' : '⚪'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border', priorityColor[rec.priority])}>
                  {rec.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
