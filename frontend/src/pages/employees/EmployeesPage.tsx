import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, Clock, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatDate, cn, getInitials } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  role: z.enum(['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE']),
  stationId: z.string().uuid('Please select a station'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get<{
        data: Array<{
          id: string; employeeCode: string; position: string; department: string | null;
          baseSalary: number; hireDate: string; isActive: boolean;
          user: { id: string; email: string; firstName: string; lastName: string; phone: string | null; role: string; avatarUrl: string | null; lastLoginAt: string | null };
          station: { name: string };
        }>;
        meta: { total: number; totalPages: number };
      }>(`/employees?${params}`);
      return res.data;
    },
  });

  const { data: stations } = useQuery({
    queryKey: ['settings-stations-list'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; name: string }> }>('/settings/stations');
      return res.data.data;
    },
    enabled: user?.role === 'SUPER_ADMIN' && showForm,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<{ data: { station: { id: string; name: string } } }>('/settings');
      return res.data.data;
    },
    enabled: user?.role === 'STATION_MANAGER' && showForm,
  });

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'EMPLOYEE',
      stationId: user?.stationId || '',
    }
  });

  useEffect(() => {
    if (showForm) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: user?.role === 'STATION_MANAGER' ? 'EMPLOYEE' : 'SUPER_ADMIN',
        stationId: user?.stationId || '',
      });
    }
  }, [showForm, user, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      await api.post('/employees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee added successfully');
      setShowForm(false);
      reset();
    },
    onError: (err: any) => {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          setError(e.field as any, { type: 'manual', message: e.message });
        });
      } else {
        const message = err.response?.data?.message || 'Failed to add employee';
        toast.error(message);
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm">{data?.meta.total ?? '–'} staff members</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'STATION_MANAGER') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9 w-full"
          />
        </div>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((emp) => (
              <Link key={emp.id} to={`/employees/${emp.id}`} className="glass-card-hover p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-fuel flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(emp.user.firstName, emp.user.lastName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{emp.user.firstName} {emp.user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserCheck className="w-3 h-3" />
                      <span className="font-mono">{emp.employeeCode}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{emp.station.name}</p>
                    {emp.department && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {emp.department}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">Previous</button>
              <span className="px-4 py-2 text-sm text-muted-foreground">Page {page} of {data.meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages}
                className="px-4 py-2 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">Next</button>
            </div>
          )}
        </>
      )}

      {/* Add Employee Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in relative max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-5">Add New Employee</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">First Name *</label>
                  <input {...register('firstName')} className="form-input w-full" placeholder="John" />
                  {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Last Name *</label>
                  <input {...register('lastName')} className="form-input w-full" placeholder="Doe" />
                  {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Email *</label>
                <input {...register('email')} type="email" className="form-input w-full" placeholder="john.doe@fuelcore.io" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Password *</label>
                <input {...register('password')} type="password" className="form-input w-full" placeholder="••••••••" />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Role *</label>
                  <select {...register('role')} className="form-input w-full bg-background text-foreground">
                    {user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                    <option value="STATION_MANAGER">Station Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                  {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role.message}</p>}
                </div>
                
                <div>
                  <label className="form-label block text-xs font-semibold uppercase tracking-wider mb-1">Assigned Station *</label>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <select {...register('stationId')} className="form-input w-full bg-background text-foreground">
                      <option value="">-- Select --</option>
                      {stations?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <div>
                      <input 
                        type="text" 
                        readOnly 
                        value={settings?.station.name || 'Loading station...'} 
                        className="form-input w-full opacity-60 cursor-not-allowed bg-secondary/20" 
                      />
                      <input type="hidden" {...register('stationId')} />
                    </div>
                  )}
                  {errors.stationId && <p className="text-red-400 text-xs mt-1">{errors.stationId.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
