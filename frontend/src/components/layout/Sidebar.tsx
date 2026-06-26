import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Fuel, Activity, Package, Users, Car, Receipt,
  BarChart3, BrainCircuit, Bell, Settings, ChevronLeft, ChevronRight,
  LogOut, Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'] },
  { icon: Activity, label: 'Sales', path: '/sales', roles: ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'] },
  { icon: Fuel, label: 'Pumps', path: '/pumps', roles: ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'] },
  { icon: Package, label: 'Inventory', path: '/inventory', roles: ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'] },
  { icon: Users, label: 'Employees', path: '/employees', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
  { icon: Car, label: 'Fleet', path: '/fleet', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
  { icon: Receipt, label: 'Expenses', path: '/expenses', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
  { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
  { icon: BrainCircuit, label: 'Analytics', path: '/analytics', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['SUPER_ADMIN', 'STATION_MANAGER'] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-fuel-dark border-r border-border flex flex-col transition-all duration-300 z-50',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-fuel flex items-center justify-center flex-shrink-0 shadow-glow-indigo">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="font-bold text-foreground text-sm leading-tight">FuelCore</p>
            <p className="text-[10px] text-muted-foreground">Enterprise Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-link group relative',
                isActive && 'active',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}

            {/* Tooltip when collapsed */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-card">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-3">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-fuel flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-secondary/50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-card z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
