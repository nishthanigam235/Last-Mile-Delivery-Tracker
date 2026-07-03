import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Package,
  Clock,
  TrendingUp,
  AlertOctagon,
  Users,
  Map,
  Truck,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [ordersRes, agentsRes, zonesRes] = await Promise.all([
          api.get('/api/orders'),
          api.get('/api/agents'),
          api.get('/api/zones'),
        ]);

        if (ordersRes.data.success) setOrders(ordersRes.data.data);
        if (agentsRes.data.success) setAgents(agentsRes.data.data);
        if (zonesRes.data.success) setZones(zonesRes.data.data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Error fetching analytics statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Aggregated analytical metrics
  const totalOrders = orders.length;
  const pendingAssignment = orders.filter((o) => !o.assignedAgent && o.status !== 'Delivered' && o.status !== 'Failed').length;
  const inTransit = orders.filter((o) => ['Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === 'Delivered').length;
  const failed = orders.filter((o) => o.status === 'Failed').length;
  const revenue = orders.reduce((sum, o) => sum + (o.status !== 'Failed' ? o.deliveryCharge : 0), 0);
  const availableAgentsCount = agents.filter((a) => a.isAvailable).length;

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Created':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Picked Up':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'In Transit':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Out for Delivery':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
        <p className="mt-3 text-xs text-slate-500">Loading admin analytics panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Logistics Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time status metrics, revenue records, and shipment volumes.</p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Analytical Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total revenue */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Rs. {revenue.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Excludes failed deliveries</p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{totalOrders}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{delivered} completed shipments</p>
          </div>
        </div>

        {/* Active Transits */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Transit</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Truck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{inTransit}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{pendingAssignment} pending agent allocation</p>
          </div>
        </div>

        {/* Failed Shipments */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Failures</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertOctagon className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{failed}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Customers notified for rescheduling</p>
          </div>
        </div>
      </div>

      {/* Secondary statistics details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Operations panel */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 lg:col-span-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
            System Operations
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-3">
              <Users className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
              <span className="text-white font-bold">{agents.length}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Total Agents</p>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-3">
              <Clock className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
              <span className="text-brand-400 font-bold">{availableAgentsCount}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Available Agents</p>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-3 col-span-2">
              <Map className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
              <span className="text-white font-bold">{zones.length}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Service Zones Active</p>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-900">
            <Link
              to="/admin/orders"
              className="flex items-center justify-between rounded-xl bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/20 px-4 py-3 text-xs font-semibold text-brand-400 transition-all"
            >
              <span>Manage Shipments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/zones"
              className="flex items-center justify-between rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 transition-all"
            >
              <span>Zone & Pincode Configurations</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Recent Bookings table */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Activity
            </h3>
            <Link to="/admin/orders" className="text-xs text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <tr>
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order._id} className="hover:bg-slate-900/20">
                      <td className="py-3 font-bold text-white">{order.orderId}</td>
                      <td className="py-3 text-slate-400 max-w-[120px] truncate">{order.customer?.name}</td>
                      <td className="py-3">
                        <span className={`inline-block rounded px-2 py-0.5 font-bold ${getStatusBadgeStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold">Rs. {order.deliveryCharge.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No recent shipment order bookings registered in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
