import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingLibraryIcon, GlobeAltIcon, RadioIcon, SparklesIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import api from "../api";

export default function LibrarySelectionPage({ onSelect }) {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const res = await api.get("/libraries");
        setLibraries(res.data);
      } catch (err) {
        setError("Network Interrupt: Failed to synchronize localized nodes.");
      } finally {
        setLoading(false);
      }
    };
    fetchLibraries();
  }, []);

  const handleSelect = (libId) => {
    localStorage.setItem("selectedLibraryId", libId);
    if (onSelect) {
      onSelect(libId);
      return;
    }
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent transition-colors duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin shadow-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-[var(--bg-main)] transition-colors duration-700 font-sans">
      {/* Extreme Premium Ambient Effects */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-500/[0.04] blur-[180px] rounded-full -mr-72 -mt-72 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-violet-600/[0.03] blur-[150px] rounded-full -ml-80 -mb-80 pointer-events-none" />

      <div className="max-w-7xl w-full relative z-10 py-20 px-4">
        <div className="text-center space-y-8 mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000 group">
          <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-[var(--bg-main)]/50 border-2 border-indigo-500/20 shadow-xl backdrop-blur-xl">
            <RadioIcon className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] italic">Node Discovery Protocol</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-[var(--text-main)] astu-title tracking-tighter leading-tight uppercase italic transition-all group-hover:tracking-tight">
            Select <span className="astu-accent-gradient bg-clip-text text-transparent italic">Terminal Sector</span>
          </h1>
          <p className="text-[var(--text-muted)] text-2xl max-w-3xl mx-auto leading-relaxed italic font-medium opacity-80 uppercase tracking-tighter leading-relaxed">
            Initialize secure uplink to a localized research node to access high-performance desktop clusters and archival partitions.
          </p>
        </div>

        {error && (
          <div className="astu-glass border-red-500/30 bg-red-500/5 px-10 py-6 rounded-[3rem] text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.5em] text-center mb-16 shadow-2xl flex items-center justify-center gap-6 italic animate-in zoom-in-95 duration-700">
             <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_red]" />
             PROTOCOL_EXCEPTION: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {libraries.map((lib, idx) => (
            <button
              key={lib.id}
              onClick={() => handleSelect(lib.id)}
              style={{ animationDelay: `${idx * 150}ms` }}
              className="astu-glass p-12 rounded-[4.5rem] border-2 border-[var(--glass-border)] astu-glass-hover group cursor-pointer text-left relative overflow-hidden h-full flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] bg-[var(--glass-bg)]/30 hover:bg-indigo-600/[0.05] transition-all duration-700 animate-in fade-in slide-in-from-bottom-12 fill-mode-both hover:-translate-y-4 hover:shadow-indigo-500/10"
            >
              {/* Decorative Card Background */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-700" />
              
              <div className="absolute top-0 right-0 p-12 transform group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000 opacity-20 group-hover:opacity-100">
                 <div className="h-14 w-14 rounded-2xl border-2 border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-2xl bg-white dark:bg-slate-900 group-hover:border-indigo-500/40 transition-colors">
                    <BuildingLibraryIcon className="h-8 w-8" />
                 </div>
              </div>

              <div className="flex-1 space-y-10 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse" />
                   <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.5em] italic">Sector Ready // Active</p>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-white transition-colors astu-title uppercase tracking-tighter italic leading-none">
                    {lib.name}
                  </h2>
                  <p className="text-[var(--text-muted)] text-base font-medium leading-relaxed italic opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                    Isolated research environment containing localized desktop pools and digital archives.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                   {["Fiber Node", "Isolated", "SSD Mesh"].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full border border-indigo-500/10 text-[8px] font-black text-indigo-500 uppercase tracking-widest italic">{tag}</span>
                   ))}
                </div>
              </div>

              <div className="mt-16 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.5em] italic relative z-10 transition-colors duration-700">
                <span className="text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-white transition-colors duration-700">Initialize Uplink</span>
                <div className="h-14 w-14 rounded-[1.5rem] bg-[var(--bg-main)]/50 border-2 border-[var(--glass-border)] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-700 group-hover:translate-x-4 shadow-xl group-hover:shadow-indigo-500/40">
                   <SparklesIcon className="h-6 w-6 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-125" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extreme Footer Branded Marker */}
      <div className="absolute bottom-10 left-10 flex items-center gap-6 opacity-30 hover:opacity-100 transition-opacity">
         <div className="h-10 w-10 rounded-xl astu-accent-gradient flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
            <CpuChipIcon className="h-6 w-6 text-white" />
         </div>
         <div>
            <p className="text-sm font-black text-[var(--text-main)] astu-title italic leading-none uppercase tracking-tighter">Network Topology</p>
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.6em] italic mt-1 leading-none shadow-sm">Global Archival Mesh</p>
         </div>
      </div>
    </div>
  );
}
