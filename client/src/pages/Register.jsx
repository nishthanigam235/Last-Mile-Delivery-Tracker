import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Phone, Lock, Tag, Map, AlertCircle } from 'lucide-react';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [zone, setZone] = useState('');
  
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'delivery_agent') {
        navigate('/agent/orders');
      } else {
        navigate('/customer/orders');
      }
    }
  }, [user, navigate]);

  // Fetch zones on mount to display if Agent role is selected
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get('/api/zones');
        if (res.data.success) {
          setZones(res.data.data);
          if (res.data.data.length > 0) {
            setZone(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch zones for registration dropdown (guest mode or database not ready)', err);
      }
    };
    fetchZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const targetZone = role === 'delivery_agent' ? zone : null;
    const res = await register(name, email, password, phone, role, targetZone);
    setLoading(false);

    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 text-center">Create a New Account</h2>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
              placeholder="e.g. john@company.com"
            />
          </div>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Phone className="h-4 w-4" />
            </div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
              placeholder="e.g. +91 9876543210"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Password (Min 6 characters)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Role
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Tag className="h-4 w-4" />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
            >
              <option value="customer" className="bg-slate-900 text-white">Customer</option>
              <option value="delivery_agent" className="bg-slate-900 text-white">Delivery Agent</option>
              <option value="admin" className="bg-slate-900 text-white">Admin</option>
            </select>
          </div>
        </div>

        {/* Zone Selector (Delivery Agent Only) */}
        {role === 'delivery_agent' && zones.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Assigned Hub / Zone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Map className="h-4 w-4" />
              </div>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-brand-500 focus:bg-slate-905 focus:outline-none"
              >
                {zones.map((z) => (
                  <option key={z._id} value={z._id} className="bg-slate-900 text-white">
                    {z.zoneName} ({z.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      {/* Login Toggle */}
      <p className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
          Log in here
        </Link>
      </p>
    </div>
  );
};

export default Register;
