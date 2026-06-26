import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Receipt, TrendingUp, Filter, Plus, Loader2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatCurrency, formatDate, cn } from '../../utils/cn';

const CATEGORIES = ['UTILITIES', 'MAINTENANCE', 'SALARIES', 'SUPPLIES', 'TRANSPORT', 'MISCELLANEOUS', 'MARKETING', 'INSURANCE'];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (category) params.set('category', category);
      const res = await api.get<{
        data: Array<{ id: string; title: string; amount: number; category: string; expenseDate: string; description: string | null; station: { name: string } }>;
        meta: { total: number; totalPages: number };
      }>(`/expenses?${params}`);
      return res.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const res = await api.get<{ data: { totalAmount: number; totalCount: number; byCategory: Array<{ category: string; amount: number; count: number }> } }>('/expenses/summary');
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    title: string; amount: number; category: string; expenseDate: string; description?: string;
  }>();

  const createMutation = useMutation({
    mutationFn: async (data: object) => { await api.post('/expenses', data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast.success('Expense recorded');
      setShowForm(false);
      reset();
    },
    onError: () => toast.error('Failed to record expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); },
  });

  const CATEGORY_COLORS: Record<string, string> = {
    UTILITIES: 'text-blue-400 bg-blue-400/10',
    MAINTENANCE: 'text-amber-400 bg-amber-400/10',
    SALARIES: 'text-emerald-400 bg-emerald-400/10',
    SUPPLIES: 'text-purple-400 bg-purple-400/10',
    TRANSPORT: 'text-cyan-400 bg-cyan-400/10',
    MARKETING: 'text-pink-400 bg-pink-400/10',
    INSURANCE: 'text-indigo-400 bg-indigo-400/10',
    MISCELLANEOUS: 'text-slate-400 bg-slate-400/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground text-sm">{data?.meta.total ?? '–'} records</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-2">Total Expenses (Period)</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalCount} records</p>
          </div>
          <div className="lg:col-span-2 glass-card p-5">
            <p className="text-xs text-muted-foreground mb-3">By Category</p>
            <div className="flex flex-wrap gap-2">
              {summary.byCategory.map(c => (
                <div key={c.category} className={cn('px-3 py-1.5 rounded-full text-xs font-medium', CATEGORY_COLORS[c.category] || 'text-muted-foreground bg-secondary')}>
                  {c.category}: {formatCurrency(c.amount)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="glass-card p-4 flex flex-wrap gap-2">
        {['', ...CATEGORIES].map((cat) => (
          <button key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={cn('px-3 py-1.5 text-xs rounded-full border transition-all font-medium',
              category === cat ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30')}>
            {cat || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-secondary/30"><tr><th>Title</th><th>Category</th><th>Amount</th><th>Station</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array(10).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>) :
                data?.data.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <p className="font-medium text-foreground">{exp.title}</p>
                      {exp.description && <p className="text-xs text-muted-foreground truncate max-w-48">{exp.description}</p>}
                    </td>
                    <td><span className={cn('text-xs px-2 py-0.5 rounded-full', CATEGORY_COLORS[exp.category])}>{exp.category}</span></td>
                    <td className="font-semibold text-red-400">{formatCurrency(exp.amount)}</td>
                    <td className="text-muted-foreground">{exp.station.name}</td>
                    <td className="text-muted-foreground">{formatDate(exp.expenseDate)}</td>
                    <td>
                      <button onClick={() => deleteMutation.mutate(exp.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-5">Record Expense</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate({ ...d, amount: Number(d.amount) }))} className="space-y-4">
              <div>
                <label className="form-label block">Title *</label>
                <input {...register('title', { required: true })} className="form-input w-full" placeholder="e.g. Electric Bill" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block">Amount *</label>
                  <input {...register('amount', { required: true, valueAsNumber: true })} type="number" step="0.01" className="form-input w-full" />
                </div>
                <div>
                  <label className="form-label block">Date *</label>
                  <input {...register('expenseDate', { required: true })} type="date" className="form-input w-full" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="form-label block">Category *</label>
                <select {...register('category', { required: true })} className="form-input w-full">
                  <option value="">-- Select category --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label block">Notes</label>
                <textarea {...register('description')} rows={2} className="form-input w-full resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
