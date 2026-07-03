import React from 'react';
import { Truck } from 'lucide-react';

const GuestLayout = ({ children }) => {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Dynamic blurred backdrop nodes */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/5 blur-[120px]"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 glow-brand">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">LastMile</h1>
          <p className="mt-1.5 text-sm text-slate-400">Intelligent Logistics Management System</p>
        </div>

        {/* Auth card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GuestLayout;
