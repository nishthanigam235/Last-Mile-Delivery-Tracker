import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Map, Plus, Trash2, Edit2, AlertCircle, CheckCircle } from 'lucide-react';

const ZonesManagement = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [city, setCity] = useState('');
  const [pincodes, setPincodes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/zones');
      if (res.data.success) {
        setZones(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error loading zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleEdit = (zone) => {
    setEditingId(zone._id);
    setZoneName(zone.zoneName);
    setCity(zone.city);
    setPincodes(zone.pincodes.join(', '));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setZoneName('');
    setCity('');
    setPincodes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zoneName || !city || !pincodes) {
      setErrorMessage('Please fill in all form fields.');
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingId) {
        // Update Zone
        const res = await api.put(`/api/zones/${editingId}`, {
          zoneName,
          city,
          pincodes,
        });
        if (res.data.success) {
          setSuccessMessage('Zone configuration updated successfully!');
          handleCancelEdit();
          fetchZones();
        }
      } else {
        // Create Zone
        const res = await api.post('/api/zones', {
          zoneName,
          city,
          pincodes,
        });
        if (res.data.success) {
          setSuccessMessage('Zone configuration added successfully!');
          handleCancelEdit();
          fetchZones();
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit zone. Ensure name is unique.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone configuration? This will affect rate matching.')) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.delete(`/api/zones/${id}`);
      if (res.data.success) {
        setSuccessMessage('Zone configuration deleted.');
        fetchZones();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error deleting zone.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Zone Management</h1>
        <p className="text-sm text-slate-400 mt-1">Configure physical service areas and assign pincode clusters to zones.</p>
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
        {/* Input Form Panel */}
        <div className="glass-panel rounded-2xl p-6 h-fit space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3 flex items-center gap-2">
            <Map className="h-4.5 w-4.5 text-brand-500" />
            {editingId ? 'Edit Service Zone' : 'Add New Service Zone'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Zone Name
              </label>
              <input
                type="text"
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. North Zone"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                City / Hub Location
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Mapped Pincodes</span>
                <span className="text-[9px] text-slate-500 font-normal lowercase">comma-separated list</span>
              </label>
              <textarea
                required
                rows={4}
                value={pincodes}
                onChange={(e) => setPincodes(e.target.value)}
                placeholder="e.g. 110001, 110020, 110092"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 py-2.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : editingId ? 'Update Zone' : 'Add Zone'}
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

        {/* Mapped Zones Table Panel */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Hub Configurations
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-center text-xs text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500 mr-2"></div>
              Loading list...
            </div>
          ) : zones.length > 0 ? (
            <div className="overflow-x-auto border border-slate-900 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <tr>
                    <th className="px-4 py-3">Zone Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Covered Pincodes</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {zones.map((zone) => (
                    <tr key={zone._id} className="hover:bg-slate-900/10">
                      <td className="px-4 py-3 font-bold text-white">{zone.zoneName}</td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{zone.city}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {zone.pincodes.map((pin) => (
                            <span key={pin} className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-850">
                              {pin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(zone)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-red-400 hover:bg-red-500/10"
                          title="Delete"
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
              No service zones mapped. Add your first zone using the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZonesManagement;
