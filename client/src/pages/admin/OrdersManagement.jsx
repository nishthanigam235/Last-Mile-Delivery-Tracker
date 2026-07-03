import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Package,
  Search,
  Filter,
  ArrowRight,
  User,
  Truck,
  ShieldAlert,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Action states
  const [assigningAgentId, setAssigningAgentId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideRemarks, setOverrideRemarks] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, agentsRes, zonesRes] = await Promise.all([
        api.get('/api/orders'),
        api.get('/api/agents'), // get all agents
        api.get('/api/zones'),
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      if (agentsRes.data.success) {
        setAgents(agentsRes.data.data);
      }
      if (zonesRes.data.success) {
        setZones(zonesRes.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error fetching system records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch updated info for a selected order if list refreshes
  const handleSelectOrder = async (orderId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      if (res.data.success) {
        const orderData = res.data.data;
        setSelectedOrder(orderData);
        setAssigningAgentId(orderData.assignedAgent?._id || '');
        setOverrideStatus(orderData.status);
        setOverrideRemarks('');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error loading order details.');
    }
  };

  // Trigger auto assignment
  const handleAutoAssign = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/orders/${selectedOrder._id}/assign-agent`, {
        autoAssign: true,
      });

      if (res.data.success) {
        setSuccessMessage(res.data.message || 'Auto-assignment completed successfully!');
        await handleSelectOrder(selectedOrder._id);
        fetchData();
      } else {
        setErrorMessage(res.data.message || 'Auto-assignment failed to find any agents.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error in auto-assignment routing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit manual agent assignment
  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !assigningAgentId) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/orders/${selectedOrder._id}/assign-agent`, {
        agentId: assigningAgentId,
      });

      if (res.data.success) {
        setSuccessMessage('Delivery rider assigned successfully!');
        await handleSelectOrder(selectedOrder._id);
        fetchData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to assign agent.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit manual status override
  const handleStatusOverride = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !overrideStatus) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/orders/${selectedOrder._id}/status`, {
        status: overrideStatus,
        remarks: overrideRemarks || `Status overridden by Administrator`,
      });

      if (res.data.success) {
        setSuccessMessage('Order status overridden successfully!');
        await handleSelectOrder(selectedOrder._id);
        fetchData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // 1. Search filter
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.orderId.toLowerCase().includes(term) ||
      o.pickupAddress.toLowerCase().includes(term) ||
      o.dropAddress.toLowerCase().includes(term) ||
      o.pickupPincode.includes(term) ||
      o.dropPincode.includes(term) ||
      o.customer?.name.toLowerCase().includes(term);

    // 2. Status filter
    const matchesStatus = statusFilter ? o.status === statusFilter : true;

    // 3. Zone filter
    const matchesZone = zoneFilter
      ? o.pickupZone?._id === zoneFilter || o.dropZone?._id === zoneFilter
      : true;

    // 4. Agent filter
    const matchesAgent = agentFilter
      ? o.assignedAgent?._id === agentFilter
      : true;

    return matchesSearch && matchesStatus && matchesZone && matchesAgent;
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

  // Get only available agents or agents assigned to the order currently
  const availableOrCurrentAgents = agents.filter(
    (a) => a.isAvailable || (selectedOrder && selectedOrder.assignedAgent && a._id === selectedOrder.assignedAgent._id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Order Operations</h1>
        <p className="text-sm text-slate-400 mt-1">Review deliveries, update status overrides, and execute agent assignments.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="glass-panel rounded-2xl p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5 text-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, client, addresses..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-xs text-slate-300 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Created">Created</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Failed">Failed</option>
            <option value="Rescheduled">Rescheduled</option>
          </select>
        </div>

        {/* Zone filter */}
        <div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-xs text-slate-300 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z._id} value={z._id}>
                {z.zoneName} ({z.city})
              </option>
            ))}
          </select>
        </div>

        {/* Agent filter */}
        <div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-xs text-slate-300 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Agents</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
          <p className="mt-3 text-xs text-slate-500">Loading order databases...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Orders Table Panel */}
          <div className="glass-panel rounded-2xl p-5 lg:col-span-2 space-y-4 overflow-hidden h-[600px] flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider shrink-0">
              Deliveries ({filteredOrders.length})
            </h3>

            <div className="flex-1 overflow-y-auto border border-slate-900 rounded-xl bg-slate-950/10">
              {filteredOrders.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="sticky top-0 bg-slate-900 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-850">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => handleSelectOrder(order._id)}
                        className={`hover:bg-slate-900/30 transition-all cursor-pointer ${
                          selectedOrder && selectedOrder._id === order._id
                            ? 'bg-brand-500/10 border-l-2 border-brand-500'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-white">{order.orderId}</td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[100px]">{order.customer?.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-[11px] max-w-[130px] truncate">
                            <span>{order.pickupZone?.zoneName || order.pickupPincode}</span>
                            <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>{order.dropZone?.zoneName || order.dropPincode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="inline-block h-4 w-4 text-slate-650" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">
                  No orders match filters.
                </div>
              )}
            </div>
          </div>

          {/* Action details panel */}
          <div className="space-y-6 lg:col-span-1">
            {selectedOrder ? (
              <div className="glass-panel rounded-2xl p-6 space-y-6 h-[600px] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-slate-900 pb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Booking</span>
                  <h3 className="text-md font-bold text-white mt-0.5 flex items-center justify-between">
                    {selectedOrder.orderId}
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeStyle(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Client: {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})
                  </p>
                </div>

                {/* Routing info */}
                <div className="text-xs space-y-2.5 bg-slate-900/20 border border-slate-900/50 rounded-xl p-3">
                  <div>
                    <h5 className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Pickup Address</h5>
                    <p className="text-slate-200 mt-0.5">{selectedOrder.pickupAddress}</p>
                    <span className="text-[10px] text-brand-400 font-medium">Zone: {selectedOrder.pickupZone?.zoneName} ({selectedOrder.pickupPincode})</span>
                  </div>
                  <div className="border-t border-slate-900 pt-2">
                    <h5 className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Drop Address</h5>
                    <p className="text-slate-200 mt-0.5">{selectedOrder.dropAddress}</p>
                    <span className="text-[10px] text-violet-400 font-medium">Zone: {selectedOrder.dropZone?.zoneName} ({selectedOrder.dropPincode})</span>
                  </div>
                  <div className="border-t border-slate-900 pt-2 flex justify-between font-bold text-[10px] text-brand-300 uppercase">
                    <span>Charge:</span>
                    <span>Rs. {selectedOrder.deliveryCharge.toFixed(2)} ({selectedOrder.paymentType})</span>
                  </div>
                </div>

                {/* 1. Agent Assignment Section */}
                <div className="space-y-3.5 border-t border-slate-900 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <User className="h-4 w-4 text-brand-500" />
                    Agent Assignment
                  </h4>

                  {selectedOrder.assignedAgent ? (
                    <div className="rounded-xl border border-slate-850 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{selectedOrder.assignedAgent.name}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.assignedAgent.phone}</p>
                      </div>
                      <span className="rounded bg-brand-500/10 border border-brand-500/25 px-1.5 py-0.5 text-[9px] font-bold text-brand-400 uppercase">
                        Assigned
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-900 p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                      <HelpCircle className="h-4 w-4 text-slate-650" />
                      <span>Rider assignment pending</span>
                    </div>
                  )}

                  {/* Manual Assignment select */}
                  <form onSubmit={handleManualAssign} className="flex gap-2">
                    <select
                      value={assigningAgentId}
                      onChange={(e) => setAssigningAgentId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 py-2 px-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="">Select Rider...</option>
                      {availableOrCurrentAgents.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.zone ? a.zone.zoneName : 'No Zone'}) {a.isAvailable ? ' - Available' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={actionLoading || !assigningAgentId}
                      className="rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-xs font-semibold px-4 text-white transition-all disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </form>

                  {/* Auto assignment trigger */}
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white py-2.5 transition-all disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    Auto-Assign Nearest Available Agent
                  </button>
                </div>

                {/* 2. Admin Override Status Section */}
                <div className="space-y-3 border-t border-slate-900 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-brand-500" />
                    Administrative Status Override
                  </h4>

                  <form onSubmit={handleStatusOverride} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={overrideStatus}
                          onChange={(e) => setOverrideStatus(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2 px-2 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="Created">Created</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Failed">Failed</option>
                          <option value="Rescheduled">Rescheduled</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading || overrideStatus === selectedOrder.status}
                        className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white py-2 transition-all disabled:opacity-50"
                      >
                        Override Status
                      </button>
                    </div>

                    <input
                      type="text"
                      value={overrideRemarks}
                      onChange={(e) => setOverrideRemarks(e.target.value)}
                      placeholder="Input custom override remarks..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </form>
                </div>

                {/* 3. Tracking Timeline segment */}
                <div className="space-y-3.5 border-t border-slate-900 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="h-4 w-4 text-brand-500" />
                    Timeline Log
                  </h4>

                  <div className="relative border-l border-slate-900 ml-2 pl-4 space-y-3.5 text-xs">
                    {selectedOrder.trackingHistory.map((history, idx) => (
                      <div key={history._id} className="relative">
                        <span className={`absolute -left-[22px] top-1 flex h-2 w-2 items-center justify-center rounded-full ${
                          idx === 0 ? 'bg-brand-500' : 'bg-slate-800'
                        }`}></span>
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-bold text-slate-350">{history.status}</span>
                            <span>{new Date(history.timestamp).toLocaleDateString()}</span>
                          </div>
                          {history.remarks && <p className="text-[10px] text-slate-400 italic">"{history.remarks}"</p>}
                          <span className="text-[9px] font-semibold text-slate-500">By: {history.updatedBy?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center h-[600px] text-slate-500">
                <Package className="h-10 w-10 text-slate-850 mb-3" />
                <p className="text-xs">Select a shipment booking from the left list table to configure assignments, override statuses, or track transit histories.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
