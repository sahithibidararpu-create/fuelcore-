import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SalesPage from './pages/sales/SalesPage';
import SaleDetailPage from './pages/sales/SaleDetailPage';
import CreateSalePage from './pages/sales/CreateSalePage';
import PumpsPage from './pages/pumps/PumpsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import FleetPage from './pages/fleet/FleetPage';
import FleetDetailPage from './pages/fleet/FleetDetailPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import ReportsPage from './pages/reports/ReportsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';

export default function App() {
  const { isAuthenticated, fetchMe, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && !isAuthenticated) {
      fetchMe();
    }
  }, [accessToken]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Sales */}
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/new" element={<CreateSalePage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />

          {/* Pumps */}
          <Route path="/pumps" element={<PumpsPage />} />

          {/* Inventory */}
          <Route path="/inventory" element={<InventoryPage />} />

          {/* Employees – Manager+ only */}
          <Route
            path="/employees"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <EmployeesPage />
              </RoleGuard>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <EmployeeDetailPage />
              </RoleGuard>
            }
          />

          {/* Fleet – Manager+ only */}
          <Route
            path="/fleet"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <FleetPage />
              </RoleGuard>
            }
          />
          <Route
            path="/fleet/:id"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <FleetDetailPage />
              </RoleGuard>
            }
          />

          {/* Expenses – Manager+ only */}
          <Route
            path="/expenses"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <ExpensesPage />
              </RoleGuard>
            }
          />

          {/* Reports – Manager+ only */}
          <Route
            path="/reports"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <ReportsPage />
              </RoleGuard>
            }
          />

          {/* Analytics – Manager+ only */}
          <Route
            path="/analytics"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <AnalyticsPage />
              </RoleGuard>
            }
          />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Settings – Manager+ only */}
          <Route
            path="/settings"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'STATION_MANAGER']}>
                <SettingsPage />
              </RoleGuard>
            }
          />
        </Route>
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
