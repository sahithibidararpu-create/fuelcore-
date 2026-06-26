import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserCheck, DollarSign, Clock, Calendar, BadgeCheck } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency, formatDate, formatDateTime, getInitials, cn } from '../../utils/cn';

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-400',
  ABSENT: 'bg-red-400',
  LATE: 'bg-amber-400',
  HALF_DAY: 'bg-blue-400',
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get<{ data: {
        id: string; employeeCode: string; position: string; department: string | null;
        baseSalary: number; hourlyRate: number | null; hireDate: string;
        user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
        station: { name: string };
        shifts: Array<{ id: string; date: string; checkIn: string | null; checkOut: string | null; hoursWorked: number | null; status: string }>;
      } }>(`/employees/${id}`);
      return res.data.data;
    },
  });

  const { data: payroll } = useQuery({
    queryKey: ['employee-payroll', id],
    queryFn: async () => {
      const res = await api.get<{ data: {
        attendance: { daysWorked: number; totalHours: number };
        estimatedPay: number;
      } }>(`/employees/${id}/payroll-summary`);
      return res.data.data;
    },
  });

  if (isLoading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-foreground">Employee Profile</h1>
      </div>

      {/* Profile card */}
      <div className="glass-card p-6 flex items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-fuel flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
          {getInitials(data.user.firstName, data.user.lastName)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{data.user.firstName} {data.user.lastName}</h2>
              <p className="text-muted-foreground">{data.position}</p>
              <p className="text-sm text-muted-foreground">{data.station.name} {data.department && `· ${data.department}`}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-primary">{data.employeeCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Hired {formatDate(data.hireDate)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Email</p>
              <p className="text-foreground">{data.user.email}</p>
            </div>
            {data.user.phone && (
              <div className="text-sm">
                <p className="text-muted-foreground">Phone</p>
                <p className="text-foreground">{data.user.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payroll card */}
      {payroll && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-5 text-center">
            <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.baseSalary)}</p>
            <p className="text-xs text-muted-foreground">Base Salary/yr</p>
          </div>
          <div className="glass-card p-5 text-center">
            <Calendar className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{payroll.attendance.daysWorked}</p>
            <p className="text-xs text-muted-foreground">Days This Month</p>
          </div>
          <div className="glass-card p-5 text-center">
            <DollarSign className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatCurrency(payroll.estimatedPay)}</p>
            <p className="text-xs text-muted-foreground">Estimated Pay</p>
          </div>
        </div>
      )}

      {/* Attendance */}
      <div className="glass-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Attendance History</h3>
          <div className="flex gap-3 text-xs">
            {Object.entries(ATTENDANCE_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', color)} />
                <span className="text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.shifts.slice(0, 20).map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.date)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-2 h-2 rounded-full', ATTENDANCE_COLORS[s.status] || 'bg-muted')} />
                      <span className="text-xs">{s.status}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground text-xs">{s.checkIn ? formatDateTime(s.checkIn) : '–'}</td>
                  <td className="text-muted-foreground text-xs">{s.checkOut ? formatDateTime(s.checkOut) : '–'}</td>
                  <td className="font-medium">{s.hoursWorked ? `${s.hoursWorked.toFixed(1)}h` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
