import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  Truck,
  Calendar,
  MapPin,
  Box,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Rescheduling states
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');

  const fetchOrderDetails = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/api/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) {
      setErrorMessage('Please select a valid date for rescheduling.');
      return;
    }

    setRescheduling(true);
    setErrorMessage('');
    setRescheduleSuccess('');

    try {
      const res = await api.put(`/api/orders/${id}/reschedule`, {
        rescheduleDate,
      });

      if (res.data.success) {
        setRescheduleSuccess('Shipment rescheduled successfully!');
        // Refresh details
        await fetchOrderDetails();
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error rescheduling order');
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
        <p className="mt-3 text-xs text-slate-500">Loading tracking details...</p>
      </div>
    );
  }

  if (errorMessage && !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
        <Link to="/customer/orders" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

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

  // Restrict date selection to future days only
  const getMinDateString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // tomorrow onwards
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/customer/orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-900 bg-slate-900/30 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Order {order.orderId}
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeStyle(order.status)}`}>
                {order.status}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {rescheduleSuccess && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{rescheduleSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Core details column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Details Panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <Box className="h-4.5 w-4.5 text-brand-500" />
              Shipment Specifications
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Route */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4.5 w-4.5 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-[10px] text-brand-400 font-bold">A</div>
                    <div className="w-px flex-1 bg-slate-900 my-1"></div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pickup From</h4>
                    <p className="text-sm text-white mt-1">{order.pickupAddress}</p>
                    <p className="text-xs text-brand-400 font-medium mt-1">Zone: {order.pickupZone?.zoneName} ({order.pickupPincode})</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4.5 w-4.5 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-400 font-bold">B</div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliver To</h4>
                    <p className="text-sm text-white mt-1">{order.dropAddress}</p>
                    <p className="text-xs text-violet-400 font-medium mt-1">Zone: {order.dropZone?.zoneName} ({order.dropPincode})</p>
                  </div>
                </div>
              </div>

              {/* Package specs & charges */}
              <div className="rounded-2xl bg-slate-900/10 border border-slate-900 p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specs & Billing</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Dimensions (L×B×H):</span>
                    <p className="font-semibold text-white mt-0.5">
                      {order.packageDimensions.length} × {order.packageDimensions.breadth} × {order.packageDimensions.height} cm
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Actual Weight:</span>
                    <p className="font-semibold text-white mt-0.5">{order.actualWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Volumetric Weight:</span>
                    <p className="font-semibold text-white mt-0.5">{order.volumetricWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Billable Weight:</span>
                    <p className="font-bold text-brand-300 mt-0.5">{order.billableWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Order/Payment Type:</span>
                    <p className="font-semibold text-white mt-0.5">{order.orderType} / {order.paymentType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Fee:</span>
                    <p className="font-extrabold text-brand-400 mt-0.5">Rs. {order.deliveryCharge.toFixed(2)}</p>
                  </div>
                </div>
                {order.rescheduleDate && (
                  <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-xs text-amber-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Rescheduled Target:</span>
                    <span className="font-bold">{new Date(order.rescheduleDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Failed Rescheduling Panel */}
          {order.status === 'Failed' && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="font-bold">Delivery Attempt Failed</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our agent was unable to complete the delivery of your shipment.
                {order.failReason && (
                  <span> Reason given: <strong className="text-white">"{order.failReason}"</strong>.</span>
                )}
                Please select a new date below to reschedule the delivery. We will assign an agent for the new attempt date.
              </p>

              <form onSubmit={handleReschedule} className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="date"
                    required
                    min={getMinDateString()}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pl-10 pr-4 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white px-5 py-2.5 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-brand-600/15 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {rescheduling ? 'Rescheduling...' : 'Reschedule Attempt'}
                </button>
              </form>
            </div>
          )}

          {/* Delivery Rider details panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-md font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-brand-500" />
              Delivery Agent Information
            </h3>

            {order.assignedAgent ? (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-850 text-brand-400 font-bold text-md">
                  {order.assignedAgent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{order.assignedAgent.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Phone: {order.assignedAgent.phone}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Email: {order.assignedAgent.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <HelpCircle className="h-5 w-5 text-slate-600" />
                <span>Rider auto-assignment pending or agent not yet assigned by administrator.</span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Timeline Column */}
        <div>
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-brand-500" />
              Tracking Timeline
            </h3>

            {/* Vertical timeline */}
            <div className="relative border-l border-slate-900 ml-3 pl-6 space-y-6 text-sm">
              {order.trackingHistory.map((history, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={history._id} className="relative">
                    {/* Circle Node */}
                    <span className={`absolute -left-[30px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                      isFirst
                        ? 'bg-brand-500 border-brand-400 shadow-md shadow-brand-500/30 animate-pulse'
                        : 'bg-slate-900 border-slate-700'
                    }`}></span>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className={`font-bold ${isFirst ? 'text-white' : 'text-slate-300'}`}>
                          {history.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(history.timestamp).toLocaleDateString()} {new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {history.remarks && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          "{history.remarks}"
                        </p>
                      )}

                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                        Updated By: {history.updatedBy?.name} ({history.updatedBy?.role === 'admin' ? 'Admin' : history.updatedBy?.role === 'delivery_agent' ? 'Agent' : 'Customer'})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
