import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  MapPin,
  Box,
  Scale,
  DollarSign,
  AlertCircle,
  Calculator,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const CreateOrder = () => {
  const navigate = useNavigate();

  // Form States
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [height, setHeight] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('Prepaid');

  // Pricing preview states
  const [calculating, setCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Trigger preview calculations from the backend pricing engine
  const handleCalculateCharges = async (e) => {
    e.preventDefault();
    if (
      !pickupPincode ||
      !dropPincode ||
      !length ||
      !breadth ||
      !height ||
      !actualWeight
    ) {
      setErrorMessage('Please fill in pincodes, weight, and package dimensions to estimate cost.');
      return;
    }

    setCalculating(true);
    setErrorMessage('');
    setPricingResult(null);

    try {
      const res = await api.post('/api/orders/calculate', {
        pickupPincode: pickupPincode.trim(),
        dropPincode: dropPincode.trim(),
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType,
      });

      if (res.data.success) {
        setPricingResult(res.data.data);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error calculating charges. Check pincode maps.');
    } finally {
      setCalculating(false);
    }
  };

  // Submit and save the finalized order
  const handleConfirmOrder = async () => {
    if (!pricingResult) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.post('/api/orders', {
        pickupAddress,
        pickupPincode: pickupPincode.trim(),
        dropAddress,
        dropPincode: dropPincode.trim(),
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType,
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/customer/orders');
        }, 1800);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white">Order Confirmed!</h2>
        <p className="mt-2 text-slate-400">Your order has been registered. Redirecting to tracking panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Delivery Order</h1>
        <p className="text-sm text-slate-400 mt-1">Submit package details, detect service zones, and check pricing estimates.</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Form Panel */}
        <form onSubmit={handleCalculateCharges} className="space-y-6 lg:col-span-2">
          {/* Address Details */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-md font-bold text-white">
              <MapPin className="h-4.5 w-4.5 text-brand-500" />
              Routing Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Pickup info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pickup Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Full street details, landmark, city"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pickup Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    placeholder="e.g. 110020"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Drop info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Drop Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    placeholder="Full street details, landmark, city"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Drop Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value)}
                    placeholder="e.g. 400011"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dimensions & Weight */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-md font-bold text-white">
              <Box className="h-4.5 w-4.5 text-brand-500" />
              Package Specifications
            </h3>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Length (cm)
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="L"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Breadth (cm)
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={breadth}
                  onChange={(e) => setBreadth(e.target.value)}
                  placeholder="B"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="H"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Scale className="h-3 w-3" /> Actual Weight (kg)
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder="kg"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Config Flags */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-md font-bold text-white">
              <DollarSign className="h-4.5 w-4.5 text-brand-500" />
              Service & Payment Configuration
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                >
                  <option value="B2C" className="bg-slate-900">B2C (Retail Delivery)</option>
                  <option value="B2B" className="bg-slate-900">B2B (Enterprise Logistics)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:bg-slate-900 focus:outline-none"
                >
                  <option value="Prepaid" className="bg-slate-900">Prepaid (Card / UPI)</option>
                  <option value="COD" className="bg-slate-900">COD (Cash on Delivery)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={calculating}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-900/80 px-6 py-3 text-sm font-semibold text-white transition-all w-full"
          >
            <Calculator className="h-4.5 w-4.5 text-brand-400" />
            {calculating ? 'Processing rates...' : 'Calculate Delivery Charge Preview'}
          </button>
        </form>

        {/* Right Preview Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <h3 className="text-md font-bold text-white border-b border-slate-900 pb-3">
              Pricing Details
            </h3>

            {pricingResult ? (
              <div className="space-y-4 text-sm">
                {/* Zone Routing */}
                <div className="rounded-xl bg-slate-900/30 border border-slate-900/50 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Detected Zones</span>
                  <div className="flex items-center justify-between text-xs text-white">
                    <div>
                      <p className="font-semibold">{pricingResult.pickupZone.zoneName}</p>
                      <p className="text-[10px] text-slate-400">{pricingResult.pickupZone.city}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <div className="text-right">
                      <p className="font-semibold">{pricingResult.dropZone.zoneName}</p>
                      <p className="text-[10px] text-slate-400">{pricingResult.dropZone.city}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-900 mt-2 pt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Route Type:</span>
                    <span className="font-bold text-brand-400 uppercase tracking-wide">
                      {pricingResult.zoneType} (Intra-Zone)
                    </span>
                  </div>
                </div>

                {/* Weight Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Actual Weight:</span>
                    <span className="text-white font-medium">{actualWeight} kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Volumetric Weight:</span>
                    <span className="text-white font-medium">{pricingResult.volumetricWeight} kg</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t border-slate-900 pt-2 text-brand-300">
                    <span>Billable Weight:</span>
                    <span>{pricingResult.billableWeight} kg</span>
                  </div>
                </div>

                {/* Rates breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Rate per kg:</span>
                    <span className="text-white">Rs. {pricingResult.rateUsed.pricePerKg.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Base Cost:</span>
                    <span className="text-white font-medium">Rs. {pricingResult.baseCharge.toFixed(2)}</span>
                  </div>
                  {pricingResult.codSurcharge > 0 && (
                    <div className="flex justify-between text-xs text-amber-400">
                      <span>COD Surcharge:</span>
                      <span>+ Rs. {pricingResult.codSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total Charges */}
                <div className="pt-3 border-t border-brand-500/20 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Total Charge:</span>
                  <span className="text-xl font-black text-brand-400">
                    Rs. {pricingResult.deliveryCharge.toFixed(2)}
                  </span>
                </div>

                {/* Confirmation Button */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 shadow-lg shadow-brand-600/25 mt-4 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  {submitting ? 'Submitting Order...' : 'Confirm and Create Order'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                <Calculator className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-xs">Fill in routing and package details to see the delivery charges preview here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
