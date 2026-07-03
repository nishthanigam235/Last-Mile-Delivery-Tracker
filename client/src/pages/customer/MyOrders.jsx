import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Package, Search, PlusCircle, Calendar, ArrowRight, Eye, RefreshCw } from 'lucide-react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Fetch orders for customer
      const res = await api.get('/api/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(term) ||
      order.pickupAddress.toLowerCase().includes(term) ||
      order.dropAddress.toLowerCase().includes(term) ||
      order.status.toLowerCase().includes(term)
    );
  });

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
      case 'Rescheduled':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Deliveries</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage all your shipment orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/customer/create-order"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-500"
          >
            <PlusCircle className="h-4 w-4" />
            Book Shipment
          </Link>
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Filter and search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
          <Search className="h-4.5 w-4.5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Order ID, status, or addresses..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
          <p className="mt-3 text-xs text-slate-500">Loading delivery orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/10">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Charge</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 bg-slate-950/20">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-900/30 transition-all duration-150">
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-white">
                      {order.orderId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-2 max-w-xs truncate">
                        <span>{order.pickupZone?.zoneName || order.pickupPincode}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>{order.dropZone?.zoneName || order.dropPincode}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-100">
                      Rs. {order.deliveryCharge.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        to={`/customer/orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:border-brand-500/35 hover:bg-brand-500/10 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="divide-y divide-slate-900 md:hidden">
            {filteredOrders.map((order) => (
              <div key={order._id} className="p-4 space-y-3 hover:bg-slate-900/20 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{order.orderId}</span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-slate-300">
                    Rs. {order.deliveryCharge.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="truncate">{order.pickupAddress}</span>
                  <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                  <span className="truncate">{order.dropAddress}</span>
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-end">
                  <Link
                    to={`/customer/orders/${order._id}`}
                    className="flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-900/70 border border-slate-850 px-4 py-2 text-xs font-semibold text-white transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 text-brand-400" />
                    Track Shipment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-900 border-dashed py-20 text-center">
          <Package className="h-12 w-12 text-slate-800 mb-4" />
          <h3 className="text-md font-bold text-white">No Shipments Found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">You haven't booked any shipments yet or your search query didn't match any orders.</p>
          <Link
            to="/customer/create-order"
            className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500"
          >
            Create Your First Order
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
