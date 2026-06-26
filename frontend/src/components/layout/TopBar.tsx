import { Bell, Sun, Moon, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../api/axios';

export default function TopBar() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await api.get<{ data: { count: number } }>('/notifications/unread-count');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Left: Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {user?.firstName} {user?.lastName}
          <span className="ml-2 text-[10px] font-normal text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full">
            {user?.role?.replace('_', ' ')}
          </span>
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
