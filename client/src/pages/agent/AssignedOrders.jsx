import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Truck,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Navigation,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';

const AssignedOrders = () => {
  const { user, updateLocalUser } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status transition states
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Agent profile state update controls
  const [agentAvailable, setAgentAvailable] = useState(user?.isAvailable || false);
  const [lat, setLat] = useState(user?.currentLocation?.lat?.toString() || '0.0');
  const [lng, setLng] = useState(user?.currentLocation?.lng?.toString() || '0.0');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/api/orders'); // backend filters automatically by assignedAgent
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error loading assigned orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  // Fetch detail info for selected order
  const handleSelectOrder = async (orderId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      if (res.data.success) {
        const orderData = res.data.data;
        setSelectedOrder(orderData);
        setNewStatus(orderData.status);
        setStatusRemarks('');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error loading order details.');
    }
  };

  // Submit agent coordinates / availability updates
  const handleSyncProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/agents/${user.id}`, {
        isAvailable: agentAvailable,
        currentLocation: {
          lat: parseFloat(lat || 0.0),
          lng: parseFloat(lng || 0.0),
        },
      });

      if (res.data.success) {
        setSuccessMessage('Profile status & GPS synced with base server!');
        // Update context
        updateLocalUser(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to sync rider profile details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit order status transition
  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        remarks: statusRemarks || `Updated by rider ${user.name}`,
      });

      if (res.data.success) {
        setSuccessMessage(`Order updated to status: ${newStatus}`);
        await handleSelectOrder(selectedOrder._id);
        fetchAssignedOrders();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update shipment status.');
    } finally {
      setActionLoading(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rider Console</h1>
          <p className="text-sm text-slate-400 mt-1">Manage assigned packages, report coordinates, and update delivery states.</p>
        </div>
        <button
          onClick={fetchAssignedOrders}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-350 hover:text-white px-4 py-2 text-xs font-semibold self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Shipments
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Rider profile GPS + Assigned orders list */}
        <div className="space-y-6 lg:col-span-2">
          {/* Rider status control */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-brand-500" />
              Rider Status & GPS coordinates
            </h3>

            <form onSubmit={handleSyncProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs items-end">
              <div>
                <span className="block text-[10px] text-slate-500 mb-1.5">Availability</span>
                <select
                  value={agentAvailable ? 'online' : 'offline'}
                  onChange={(e) => setAgentAvailable(e.target.value === 'online')}
                  className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/40 py-2 px-2 text-xs text-white focus:outline-none"
                >
                  <option value="online">Online / Available</option>
                  <option value="offline">Offline / Busy</option>
                </select>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 mb-1.5">Latitude (GPS)</span>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2 px-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 mb-1.5">Longitude (GPS)</span>
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2 px-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-xs font-semibold py-2.5 text-white transition-all disabled:opacity-50"
              >
                Sync Status
              </button>
            </form>
          </div>

          {/* Assigned shipments list */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Assigned Packages ({orders.length})
            </h3>

            {loading ? (
              <div className="flex justify-center py-10 text-slate-500 text-xs">
                Loading shipments...
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => handleSelectOrder(order._id)}
                    className={`rounded-xl border p-4 cursor-pointer hover:border-slate-800 transition-all ${
                      selectedOrder && selectedOrder._id === order._id
                        ? 'border-brand-500/50 bg-slate-900/20 shadow-md shadow-brand-500/5'
                        : 'border-slate-900 bg-slate-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{order.orderId}</span>
                        {order.paymentType === 'COD' && (
                          <span className="rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase">
                            COD: Rs. {order.deliveryCharge.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-3 text-xs text-slate-450 sm:grid-cols-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Pickup Address</span>
                        <p className="text-slate-350 truncate mt-0.5">{order.pickupAddress}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Drop Address</span>
                        <p className="text-slate-350 truncate mt-0.5">{order.dropAddress}</p>
                      </div>
                    </div>

                    {order.rescheduleDate && (
                      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-indigo-400 font-bold">
                        <span>Rescheduled Shipment Attempt</span>
                        <span>Date: {new Date(order.rescheduleDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs border border-dashed border-slate-900 rounded-xl">
                No shipping orders assigned to your account. Enjoy your downtime!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Detail Actions */}
        <div>
          {selectedOrder ? (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              {/* Order header */}
              <div className="border-b border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Shipment Detail</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedOrder.orderId}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Recipient: {selectedOrder.dropAddress}</p>
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${getStatusBadgeStyle(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Package parameters */}
              <div className="text-xs space-y-2.5 bg-slate-900/20 border border-slate-900/50 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-500 text-[10px]">Actual Weight:</span>
                    <p className="font-semibold text-white mt-0.5">{selectedOrder.actualWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Billable Weight:</span>
                    <p className="font-bold text-brand-300 mt-0.5">{selectedOrder.billableWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Payment:</span>
                    <p className="font-semibold text-white mt-0.5 uppercase">{selectedOrder.paymentType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Fee due:</span>
                    <p className="font-bold text-brand-400 mt-0.5">Rs. {selectedOrder.deliveryCharge.toFixed(2)}</p>
                  </div>
                </div>
                <div className="border-t border-slate-900 pt-2 text-[10px] leading-relaxed">
                  <strong className="text-slate-400">Pickup address:</strong> {selectedOrder.pickupAddress} <br/>
                  <strong className="text-brand-400">({selectedOrder.pickupPincode})</strong>
                </div>
              </div>

              {/* Status Update Form */}
              <div className="space-y-4 border-t border-slate-900 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="h-4.5 w-4.5 text-brand-500" />
                  Transition Shipment Status
                </h4>

                <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:outline-none"
                    >
                      <option value="Picked Up">Picked Up</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed">Failed (Delivery Failed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-1.5 flex justify-between">
                      <span>Remarks / Fail Reason</span>
                      <span className="text-[9px] text-slate-500 font-normal">required for 'Failed' status</span>
                    </label>
                    <input
                      type="text"
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      required={newStatus === 'Failed'}
                      placeholder={newStatus === 'Failed' ? "e.g. Recipient door locked / phone switched off" : "e.g. Package departure from hub"}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || newStatus === selectedOrder.status}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white py-3 transition-all disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {actionLoading ? 'Updating...' : 'Submit Status Update'}
                  </button>
                </form>
              </div>

              {/* Timeline Log */}
              <div className="space-y-3.5 border-t border-slate-900 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand-500" />
                  Order Timeline Log
                </h4>

                <div className="relative border-l border-slate-900 ml-2 pl-4 space-y-3 text-[11px] max-h-36 overflow-y-auto">
                  {selectedOrder.trackingHistory.map((history, idx) => (
                    <div key={history._id} className="relative">
                      <span className="absolute -left-[20px] top-1 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-slate-800"></span>
                      <div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span className="font-bold text-slate-350">{history.status}</span>
                          <span>{new Date(history.timestamp).toLocaleDateString()}</span>
                        </div>
                        {history.remarks && <p className="text-[10px] text-slate-400 italic">"{history.remarks}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center py-20 text-slate-500">
              <ClipboardCheck className="h-10 w-10 text-slate-850 mb-3" />
              <p className="text-xs">Select a package card from your assigned list on the left to report coordinates, update delivery status, or write transit log remarks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedOrders;
