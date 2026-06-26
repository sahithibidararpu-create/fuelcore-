import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { formatCurrency, formatVolume } from '../../utils/cn';

export default function ReportsPage() {
  const { data: daily } = useQuery({
    queryKey: ['report-daily'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        date: string; revenue: number; volume: number; transactions: number;
        expenses: number; netProfit: number;
        byFuelType: Array<{ fuelType: string; volume: number; revenue: number; transactions: number }>;
        byPaymentMethod: Array<{ method: string; revenue: number; transactions: number }>;
        byPump: Array<{ pump: string; label: string; volume: number; revenue: number }>;
      } }>('/reports/daily');
      return res.data.data;
    },
  });

  const { data: monthly } = useQuery({
    queryKey: ['report-monthly'],
    queryFn: async () => {
      const res = await api.get<{ data: {
        year: number; month: number; revenue: number; volume: number; transactions: number;
        expenses: number; netProfit: number;
        weeklyBreakdown: Array<{ week: number; revenue: number; volume: number; transactions: number }>;
      } }>('/reports/monthly');
      return res.data.data;
    },
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm">Daily and monthly operational reports</p>
      </div>

      {/* Daily Report */}
      {daily && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Today's Report — {daily.date}</h2>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Revenue', value: formatCurrency(daily.revenue), color: 'text-emerald-400' },
              { label: 'Volume', value: formatVolume(daily.volume), color: 'text-cyan-400' },
              { label: 'Transactions', value: daily.transactions.toString(), color: 'text-indigo-400' },
              { label: 'Expenses', value: formatCurrency(daily.expenses), color: 'text-amber-400' },
              { label: 'Net Profit', value: formatCurrency(daily.netProfit), color: daily.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Fuel Type */}
            {daily.byFuelType.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">By Fuel Type</h3>
                <table className="w-full data-table text-xs">
                  <thead><tr><th>Fuel</th><th>Volume</th><th>Revenue</th><th>Txn</th></tr></thead>
                  <tbody>
                    {daily.byFuelType.map(f => (
                      <tr key={f.fuelType}>
                        <td><span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{f.fuelType}</span></td>
                        <td>{formatVolume(f.volume)}</td>
                        <td className="text-emerald-400 font-semibold">{formatCurrency(f.revenue)}</td>
                        <td>{f.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* By Payment Method */}
            {daily.byPaymentMethod.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">By Payment Method</h3>
                <div className="space-y-2">
                  {daily.byPaymentMethod.map(p => {
                    const total = daily.byPaymentMethod.reduce((s, m) => s + m.revenue, 0);
                    const pct = total > 0 ? (p.revenue / total) * 100 : 0;
                    return (
                      <div key={p.method}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground font-medium">{p.method}</span>
                          <span className="text-muted-foreground">{formatCurrency(p.revenue)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Report */}
      {monthly && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Monthly Report — {months[monthly.month - 1]} {monthly.year}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: formatCurrency(monthly.revenue), color: 'text-emerald-400' },
              { label: 'Volume', value: formatVolume(monthly.volume), color: 'text-cyan-400' },
              { label: 'Expenses', value: formatCurrency(monthly.expenses), color: 'text-amber-400' },
              { label: 'Net Profit', value: formatCurrency(monthly.netProfit), color: monthly.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {monthly.weeklyBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Weekly Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly.weeklyBreakdown} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="week" tickFormatter={v => `Wk ${v}`} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
