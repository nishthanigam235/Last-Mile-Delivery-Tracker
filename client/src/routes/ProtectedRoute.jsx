import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
        <p className="mt-4 text-sm font-medium tracking-wide text-slate-400">Verifying session...</p>
      </div>
    );
  }

  // Not authenticated: Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role verification
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard depending on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'delivery_agent') {
      return <Navigate to="/agent/orders" replace />;
    } else {
      return <Navigate to="/customer/orders" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
