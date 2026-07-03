import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const RateCardManagement = () => {
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [zoneType, setZoneType] = useState('intra');
  const [orderType, setOrderType] = useState('B2C');
  const [pricePerKg, setPricePerKg] = useState('');
  const [codCharge, setCodCharge] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRateCards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/rate-cards');
      if (res.data.success) {
        setRateCards(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error loading rate cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCards();
  }, []);

  const handleEdit = (card) => {
    setEditingId(card._id);
    setZoneType(card.zoneType);
    setOrderType(card.orderType);
    setPricePerKg(card.pricePerKg);
    setCodCharge(card.codCharge);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setZoneType('intra');
    setOrderType('B2C');
    setPricePerKg('');
    setCodCharge('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pricePerKg || !codCharge) {
      setErrorMessage('Please fill in price per kg and COD charge.');
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingId) {
        // Update Card
        const res = await api.put(`/api/rate-cards/${editingId}`, {
          pricePerKg: parseFloat(pricePerKg),
          codCharge: parseFloat(codCharge),
        });
        if (res.data.success) {
          setSuccessMessage('Rate card configuration updated!');
          handleCancelEdit();
          fetchRateCards();
        }
      } else {
        // Create Card
        const res = await api.post('/api/rate-cards', {
          zoneType,
          orderType,
          pricePerKg: parseFloat(pricePerKg),
          codCharge: parseFloat(codCharge),
        });
        if (res.data.success) {
          setSuccessMessage('Rate card configuration created!');
          handleCancelEdit();
          fetchRateCards();
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit rate card. Combination must be unique.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate card configuration?')) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.delete(`/api/rate-cards/${id}`);
      if (res.data.success) {
        setSuccessMessage('Rate card configuration deleted.');
        fetchRateCards();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error deleting rate card.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Rate Cards Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">Configure pricing matrices by trip type (intra/inter-zone) and business type (B2B/B2C).</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Panel */}
        <div className="glass-panel rounded-2xl p-6 h-fit space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3 flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-brand-500" />
            {editingId ? 'Edit Pricing Rates' : 'Create Pricing Rates'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Trip Route Type
              </label>
              <select
                disabled={!!editingId}
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:bg-slate-900 focus:outline-none disabled:opacity-50"
              >
                <option value="intra" className="bg-slate-900">Intra-Zone (Within same zone)</option>
                <option value="inter" className="bg-slate-900">Inter-Zone (Between different zones)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Client / Order Type
              </label>
              <select
                disabled={!!editingId}
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:bg-slate-900 focus:outline-none disabled:opacity-50"
              >
                <option value="B2C" className="bg-slate-900">B2C (Retail Clients)</option>
                <option value="B2B" className="bg-slate-900">B2B (Enterprise Clients)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Price per Kilogram (Rs.)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                placeholder="e.g. 15.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Cash on Delivery (COD) Fee (Rs.)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={codCharge}
                onChange={(e) => setCodCharge(e.target.value)}
                placeholder="e.g. 20.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 py-2.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : editingId ? 'Update Rates' : 'Create Rates'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-850 hover:bg-slate-900 py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mapped Rates Panel */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Rate Matrices
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-center text-xs text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500 mr-2"></div>
              Loading list...
            </div>
          ) : rateCards.length > 0 ? (
            <div className="overflow-x-auto border border-slate-900 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <tr>
                    <th className="px-4 py-3">Trip Type</th>
                    <th className="px-4 py-3">Order Type</th>
                    <th className="px-4 py-3">Price Per Kg</th>
                    <th className="px-4 py-3">COD Surcharge</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {rateCards.map((card) => (
                    <tr key={card._id} className="hover:bg-slate-900/10">
                      <td className="px-4 py-3 font-bold text-white capitalize">
                        {card.zoneType === 'intra' ? 'Intra-Zone' : 'Inter-Zone'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-400">{card.orderType}</td>
                      <td className="px-4 py-3 font-medium text-white">Rs. {card.pricePerKg.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-white">Rs. {card.codCharge.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(card)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
                          title="Edit Pricing"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(card._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-red-400 hover:bg-red-500/10"
                          title="Delete Pricing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs border border-dashed border-slate-900 rounded-xl">
              No rates configured. Set rates in the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateCardManagement;
