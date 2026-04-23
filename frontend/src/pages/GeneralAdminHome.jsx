import React from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheckIcon, 
  Squares2X2Icon, 
  BookOpenIcon, 
  ArrowRightIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

export default function GeneralAdminHome() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      <div className="astu-glass max-w-4xl w-full rounded-[4rem] border border-[var(--glass-border)] p-16 shadow-2xl relative overflow-hidden bg-[var(--glass-bg)]/30 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-1000">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-40" />
        
        <div className="flex flex-col items-center text-center space-y-10 relative z-10">
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner group">
             <ShieldCheckIcon className="h-12 w-12 text-rose-500 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">
               Alpha Console <span className="text-rose-500 not-italic">Prime</span>
            </h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono italic opacity-60">
               Centralized Digital Infrastructure Control
            </p>
          </div>

          <p className="text-lg text-[var(--text-muted)] font-medium max-w-2xl leading-relaxed italic opacity-80 decoration-rose-500/10 underline underline-offset-8">
            Welcome, Sovereign Administrator. The neural network for library isolation, node deployment, and cross-sector asset synchronization is fully online and awaiting your command sequences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <Link
              to="/general-admin-dashboard"
              className="astu-btn-premium group flex items-center justify-between px-8 py-6 rounded-3xl text-white shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                 <Squares2X2Icon className="h-6 w-6 opacity-60" />
                 <span className="text-xs font-black uppercase tracking-widest">Control Dashboard</span>
              </div>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>

            <Link
              to="/general-admin-library-nodes"
              className="astu-glass group flex items-center justify-between px-8 py-6 rounded-3xl border border-[var(--glass-border)] text-[var(--text-main)] hover:border-rose-500/40 hover:bg-rose-500/5 transition-all"
            >
              <div className="flex items-center gap-4">
                 <GlobeAltIcon className="h-6 w-6 text-rose-500" />
                 <span className="text-xs font-black uppercase tracking-widest">Network Nodes</span>
              </div>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-2 transition-transform text-rose-500" />
            </Link>
          </div>

          <div className="pt-10 flex items-center gap-6 opacity-40">
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_white]" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Core: Active</span>
             </div>
             <div className="h-1 w-1 rounded-full bg-slate-500" />
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_white]" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Uplink: SECURE</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
