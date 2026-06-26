import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2, Zap, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatDateTime, cn } from '../../utils/cn';

const TYPE_ICONS: Record<string, React.ElementType> = {
  LOW_STOCK: AlertTriangle,
  FLEET_CREDIT_LOW: AlertTriangle,
  SYSTEM: Info,
  INFO: Info,
};

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'border-l-red-500 bg-red-500/5',
  HIGH: 'border-l-amber-500 bg-amber-500/5',
  MEDIUM: 'border-l-blue-500 bg-blue-500/5',
  LOW: 'border-l-slate-500',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{
        id: string; title: string; message: string; type: string; priority: string;
        isRead: boolean; createdAt: string;
      }> }>('/notifications?limit=50');
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/notifications/${id}/read`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'notifications-count'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => { await api.patch('/notifications/read-all'); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/notifications/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
          !data || data.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-medium">No notifications</p>
              <p className="text-muted-foreground text-sm">You're all caught up!</p>
            </div>
          ) : (
            data.map(notif => {
              const Icon = TYPE_ICONS[notif.type] || Bell;
              return (
                <div key={notif.id} className={cn(
                  'glass-card px-5 py-4 border-l-2 flex items-start gap-4 transition-all',
                  PRIORITY_STYLES[notif.priority] || 'border-l-border',
                  !notif.isRead && 'shadow-glow-indigo'
                )}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    notif.priority === 'CRITICAL' ? 'bg-red-500/10' :
                    notif.priority === 'HIGH' ? 'bg-amber-500/10' : 'bg-indigo-500/10'
                  )}>
                    <Icon className={cn('w-4 h-4',
                      notif.priority === 'CRITICAL' ? 'text-red-400' :
                      notif.priority === 'HIGH' ? 'text-amber-400' : 'text-indigo-400'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold', notif.isRead ? 'text-muted-foreground' : 'text-foreground')}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">{formatDateTime(notif.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.isRead && (
                      <button onClick={() => markReadMutation.mutate(notif.id)}
                        className="p-1.5 text-muted-foreground hover:text-emerald-400 transition-colors rounded" title="Mark read">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(notif.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        }
      </div>
    </div>
  );
}
