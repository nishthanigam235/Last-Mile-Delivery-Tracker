import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, MapPin, Truck, Check, Edit2, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [assignedZone, setAssignedZone] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [lat, setLat] = useState('0.0');
  const [lng, setLng] = useState('0.0');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAgentsAndZones = async () => {
    setLoading(true);
    try {
      const [agentsRes, zonesRes] = await Promise.all([
        api.get('/api/agents'),
        api.get('/api/zones'),
      ]);

      if (agentsRes.data.success) {
        setAgents(agentsRes.data.data);
      }
      if (zonesRes.data.success) {
        setZones(zonesRes.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error fetching agents or zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsAndZones();
  }, []);

  const startEditAgent = (agent) => {
    setEditingAgentId(agent._id);
    setAssignedZone(agent.zone?._id || '');
    setIsAvailable(agent.isAvailable);
    setLat(agent.currentLocation?.lat?.toString() || '0.0');
    setLng(agent.currentLocation?.lng?.toString() || '0.0');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const cancelEditAgent = () => {
    setEditingAgentId(null);
    setAssignedZone('');
    setLat('0.0');
    setLng('0.0');
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    if (!editingAgentId) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.put(`/api/agents/${editingAgentId}`, {
        isAvailable,
        currentLocation: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        zone: assignedZone || null,
      });

      if (res.data.success) {
        setSuccessMessage('Delivery rider status updated successfully!');
        cancelEditAgent();
        fetchAgentsAndZones();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error updating agent details.');
    } finally {
      setActionLoading(false);
    }
  };

  const getAvailabilityBadge = (available) => {
    return available
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-red-500/10 text-red-400 border border-red-500/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Agent Management</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor delivery agent status, set availability, update coordinate locations, and edit zones.</p>
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
        {/* Active Agents list */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Delivery Riders ({agents.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-center text-xs text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500 mr-2"></div>
              Loading riders...
            </div>
          ) : agents.length > 0 ? (
            <div className="overflow-x-auto border border-slate-900 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <tr>
                    <th className="px-4 py-3">Rider Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Zone / City</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Location (GPS)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {agents.map((agent) => (
                    <tr
                      key={agent._id}
                      className={`hover:bg-slate-900/10 transition-all ${
                        editingAgentId === agent._id ? 'bg-brand-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-brand-400 shrink-0" />
                        {agent.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <p>{agent.phone}</p>
                        <p className="text-[10px] text-slate-500">{agent.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {agent.zone ? (
                          <span>{agent.zone.zoneName} ({agent.zone.city})</span>
                        ) : (
                          <span className="text-slate-550 font-normal">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getAvailabilityBadge(agent.isAvailable)}`}>
                          {agent.isAvailable ? 'Available' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {agent.currentLocation ? (
                          <span>{agent.currentLocation.lat.toFixed(4)}, {agent.currentLocation.lng.toFixed(4)}</span>
                        ) : (
                          <span>0.0, 0.0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEditAgent(agent)}
                          disabled={editingAgentId === agent._id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Modify details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs border border-dashed border-slate-900 rounded-xl">
              No delivery agents registered. Ask agents to sign up or create rider profiles.
            </div>
          )}
        </div>

        {/* Editing form Panel */}
        <div className="space-y-6">
          {editingAgentId ? (
            <div className="glass-panel rounded-2xl p-6 h-fit space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-brand-500" />
                Edit Status
              </h3>

              <form onSubmit={handleUpdateAgent} className="space-y-4 text-xs">
                {/* Zone */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assigned Zone
                  </label>
                  <select
                    value={assignedZone}
                    onChange={(e) => setAssignedZone(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 px-3 text-sm text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">No Zone (Unassigned)</option>
                    {zones.map((z) => (
                      <option key={z._id} value={z._id}>
                        {z.zoneName} ({z.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Availability Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAvailable(true)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-900/10 border-slate-800 text-slate-400'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAvailable(false)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        !isAvailable
                          ? 'bg-red-500/10 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10'
                          : 'bg-slate-900/10 border-slate-800 text-slate-400'
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                </div>

                {/* Current Geolocation (Coordinates) */}
                <div className="space-y-3">
                  <label className="block font-semibold uppercase tracking-wider text-slate-400">
                    Rider Coordinates (GPS)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Latitude</span>
                      <input
                        type="number"
                        required
                        step="0.000001"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2 px-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Longitude</span>
                      <input
                        type="number"
                        required
                        step="0.000001"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2 px-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 py-2.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Save Updates'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditAgent}
                    className="rounded-xl border border-slate-850 hover:bg-slate-900 py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center py-20 text-slate-500 h-fit">
              <Users className="h-10 w-10 text-slate-850 mb-3" />
              <p className="text-xs">Click the edit button next to any delivery agent in the list to update their status coordinates or adjust zone mapping.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;
