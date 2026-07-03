import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import GuestLayout from './layouts/GuestLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import MyOrders from './pages/customer/MyOrders';
import CreateOrder from './pages/customer/CreateOrder';
import OrderDetails from './pages/customer/OrderDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ZonesManagement from './pages/admin/ZonesManagement';
import RateCardManagement from './pages/admin/RateCardManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import AgentManagement from './pages/admin/AgentManagement';

// Agent Pages
import AssignedOrders from './pages/agent/AssignedOrders';

// Root Redirect component depending on role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
        <p className="mt-4 text-sm font-medium tracking-wide text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === 'delivery_agent') {
    return <Navigate to="/agent/orders" replace />;
  } else {
    return <Navigate to="/customer/orders" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Guest Auth Routes */}
          <Route
            path="/login"
            element={
              <GuestLayout>
                <Login />
              </GuestLayout>
            }
          />
          <Route
            path="/register"
            element={
              <GuestLayout>
                <Register />
              </GuestLayout>
            }
          />

          {/* Customer Panel Routes (Protected) */}
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardLayout>
                  <MyOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/create-order"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardLayout>
                  <CreateOrder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardLayout>
                  <OrderDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Panel Routes (Protected) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/zones"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <ZonesManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rate-cards"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <RateCardManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <OrdersManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AgentManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Delivery Agent Panel Routes (Protected) */}
          <Route
            path="/agent/orders"
            element={
              <ProtectedRoute allowedRoles={['delivery_agent']}>
                <DashboardLayout>
                  <AssignedOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Root/Fallback redirection */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
