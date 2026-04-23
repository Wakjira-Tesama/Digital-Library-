import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api";
import { BookmarkSquareIcon, FireIcon, RocketLaunchIcon, SparklesIcon } from "@heroicons/react/24/outline";

const updates = [
  {
    time: "UPLINK_09:42_AM",
    title: "Sector 3 Network Optimization",
    body: "The high-bandwidth quiet zone is undergoing a terminal sync phase for enhanced research speed.",
  },
  {
    time: "PREV_CYCLE",
    title: "Archival Policy Expansion",
    body: "Digital preservation windows have been recalibrated for graduate research protocols.",
  },
];

const fallbackCovers = [
  "/covers/algorithms.svg",
  "/covers/calculus.svg",
  "/covers/linear-algebra.svg",
  "/covers/physics.svg",
];

export default function StudentDashboard() {
  const [ebooks, setEbooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ebookRes, statsRes] = await Promise.all([
        api.get("/api/ebooks"),
        api.get("/api/ebook-user/stats").catch(() => null),
      ]);
      setEbooks(ebookRes?.data || []);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load student dashboard", err);
      setError("Synchronicity failure: Failed to connect to knowledge cluster.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topEbooks = useMemo(() => {
    const list = Array.isArray(ebooks) ? [...ebooks] : [];
    list.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    return list.slice(0, 4);
  }, [ebooks]);

  const curated = useMemo(() => ebooks.slice(0, 3), [ebooks]);

  const handleOpenEbook = async (ebook) => {
    if (!ebook) return;
    try {
      const ebookId = ebook._id || ebook.id;
      await api.post(`/api/ebooks/${ebookId}/popularity`);
      await api.post("/api/ebook-user/progress", { ebook_id: ebookId });
    } catch (err) {
      console.warn("Failed to bump popularity", err);
    }
    const url = ebook.fileUrl || ebook.externalLink;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const currentReading = stats?.currentlyReading?.ebook;
  const heroBook = currentReading || topEbooks[0] || {};
  const currentProgress = Math.round(stats?.currentlyReading?.progressPercent || 0);
  
  const monthlyCompleted = stats?.monthlyCompleted || 0;
  const monthlyGoal = stats?.monthlyGoal || 10;
  const monthlyProgress = monthlyGoal ? Math.min(100, Math.round((monthlyCompleted / monthlyGoal) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)] transition-colors duration-600">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--bg-main)]/50 text-[var(--text-main)] overflow-y-auto transition-colors duration-600 custom-scrollbar">
      <main className="max-w-7xl mx-auto px-8 py-14 space-y-16">
        {error && (
          <div className="astu-glass border-red-500/30 bg-red-500/5 px-8 py-5 rounded-[2rem] text-[10px] font-black text-red-600 dark:text-red-400 flex items-center gap-5 uppercase tracking-[0.3em] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 italic">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
            {error}
          </div>
        )}

        <section className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="astu-glass rounded-[4rem] p-12 border-2 border-[var(--glass-border)] relative overflow-hidden group min-h-[480px] flex flex-col justify-end shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] bg-[var(--glass-bg)]/40 backdrop-blur-3xl">
            <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110">
              {heroBook.coverUrl ? (
                <>
                  <div className="absolute inset-0 bg-[var(--bg-main)]/70 z-10" />
                  <img src={heroBook.coverUrl} alt="Hero Backdrop" className="w-full h-full object-cover blur-3xl opacity-30 scale-125" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-[var(--bg-main)]/40 z-0" />
              )}
            </div>

            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">Active Synchronicity</span>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-end md:items-center">
                <div className="w-40 h-56 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] border-2 border-[var(--glass-border)] bg-[var(--bg-main)] shrink-0 transform -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-1000">
                  {heroBook.coverUrl ? (
                    <img src={heroBook.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-500/5 flex items-center justify-center text-indigo-500/20 font-black italic text-xl uppercase tracking-tighter">TERM</div>
                  )}
                </div>
                
                <div className="flex-1 space-y-6">
                  <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] astu-title tracking-tighter leading-none italic uppercase">
                    {heroBook.title || "Ready for discovery?"}
                  </h1>
                  <p className="text-[var(--text-muted)] text-lg max-w-xl italic leading-relaxed line-clamp-2 font-medium opacity-80 uppercase tracking-tighter">
                   "{heroBook.description || "The collective archival of technical knowledge standardizes human potential across digital mesh networks."}"
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-10 pt-4">
                    <button
                      className="astu-btn-premium px-12 py-5 rounded-[2rem] text-[11px] font-black text-white shadow-2xl shadow-indigo-500/40 flex items-center gap-4 hover:scale-105 active:scale-95 transition-all group/btn uppercase tracking-[0.4em] italic"
                      onClick={() => handleOpenEbook(heroBook)}
                    >
                      <span>Resume Uplink</span>
                      <RocketLaunchIcon className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                    
                    <div className="space-y-4 flex-1 min-w-[240px]">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-muted)]">
                        <span className="italic">Partition Progress</span>
                        <span className="text-indigo-600 dark:text-indigo-300">{currentProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--glass-border)] rounded-full overflow-hidden border border-[var(--glass-border)] shadow-inner">
                        <div 
                          className="h-full astu-accent-gradient shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000"
                          style={{ width: `${currentProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="astu-glass rounded-[3rem] p-10 border border-[var(--glass-border)] relative overflow-hidden group shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl">
              <div className="absolute top-0 right-0 p-8 text-7xl font-black text-indigo-500/5 italic select-none -tr-10">STATS</div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6 italic">Intellectual Velocity</p>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-5xl font-black text-[var(--text-main)] tracking-tighter uppercase italic">{monthlyCompleted}</span>
                <span className="text-[var(--text-muted)] text-sm font-black uppercase tracking-[0.4em] italic opacity-40">/ {monthlyGoal}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-tighter italic opacity-60 leading-relaxed">Publications finalized in this cycle</p>
              
              <div className="relative h-2 w-full bg-[var(--glass-border)] rounded-full overflow-hidden my-10 shadow-inner">
                <div 
                  className="absolute inset-y-0 left-0 astu-accent-gradient shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <BookmarkSquareIcon className="h-5 w-5 text-indigo-500" />
                  <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic">Level 4 Scholar</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] italic">{monthlyProgress}% TARGET</span>
                </div>
              </div>
            </div>

            <div className="astu-glass rounded-[3rem] p-10 border border-[var(--glass-border)] shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl space-y-10">
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic leading-none">Security Pulse</p>
                 <SparklesIcon className="h-5 w-5 text-indigo-500/30" />
              </div>
              <div className="space-y-10">
                {updates.map((item) => (
                  <div key={item.title} className="group cursor-default relative pl-6 border-l border-indigo-500/20 hover:border-indigo-500 transition-colors">
                    <p className="text-[9px] font-black text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors uppercase tracking-[0.4em] mb-2 italic tabular-nums">{item.time}</p>
                    <h4 className="text-xs font-black text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-white transition-colors mb-2 astu-title uppercase tracking-tight italic">{item.title}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 font-medium italic opacity-70 uppercase tracking-tighter leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
              <button className="w-full py-5 rounded-2xl border border-[var(--glass-border)] text-[9px] font-black text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/5 transition-all uppercase tracking-[0.4em] shadow-sm italic bg-[var(--bg-main)]/50">
                Archive intelligence
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-3 italic leading-none">Network Activity</p>
              <h3 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">Emerging Knowledge Clusters</h3>
            </div>
            <button className="text-[10px] font-black text-[var(--text-muted)] hover:text-indigo-500 transition-all flex items-center gap-4 group uppercase tracking-[0.5em] italic underline decoration-indigo-500/20 underline-offset-8">
              Explore Entire Collective <span className="group-hover:translate-x-3 transition-transform text-indigo-500">→</span>
            </button>
          </div>
          
          <div className="grid gap-10 sm:grid-cols-4 px-2">
            {topEbooks.map((ebook, index) => (
              <div
                key={ebook._id || ebook.id || index}
                className="astu-glass p-7 rounded-[3.5rem] border border-[var(--glass-border)] astu-glass-hover group cursor-pointer shadow-xl bg-[var(--glass-bg)]/20 hover:scale-105 transition-all duration-700"
                onClick={() => handleOpenEbook(ebook)}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-[var(--bg-main)]/80 border-2 border-[var(--glass-border)] shadow-2xl transition-all duration-700 group-hover:-translate-y-4 group-hover:rotate-1 group-hover:shadow-indigo-500/10">
                  <img 
                    src={ebook.coverUrl || fallbackCovers[index % fallbackCovers.length]} 
                    className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100" 
                    alt="Cover" 
                  />
                </div>
                <div className="mt-8 px-2 text-center space-y-2">
                  <h4 className="text-xs font-black text-[var(--text-main)] group-hover:text-indigo-500 transition-colors line-clamp-1 astu-title uppercase tracking-tight italic">
                    {ebook.title || "Analyzing Data Structs"}
                  </h4>
                  <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.5em] opacity-40 italic">
                    {ebook.author || "Sector Faculty"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="astu-glass rounded-[4rem] p-16 border-2 border-[var(--glass-border)] relative overflow-hidden shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -mr-96 -mt-96 pointer-events-none group-hover:opacity-100 transition-opacity duration-1000 opacity-50" />
          
          <div className="flex flex-col md:flex-row md:items-center gap-12 mb-16 relative z-10">
            <div className="h-20 w-20 rounded-3xl astu-accent-gradient flex items-center justify-center p-0.5 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
               <div className="bg-white dark:bg-slate-900 h-full w-full rounded-[1.2rem] flex items-center justify-center">
                  <SparklesIcon className="h-10 w-10 text-indigo-500" />
               </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">Curated Knowledge Meshes</h4>
              <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-[0.4em] mt-3 italic opacity-60">Deep archival optimization for your current field of inquiry</p>
            </div>
            <button className="md:ml-auto px-10 py-4.5 rounded-full border border-[var(--glass-border)] text-[9px] font-black text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/5 transition-all shadow-sm uppercase tracking-[0.4em] bg-[var(--bg-main)]/50 italic">
              Recalibrate Preferences
            </button>
          </div>

          <div className="grid gap-12 md:grid-cols-3 relative z-10 px-2">
            {curated.map((ebook, index) => (
              <div
                key={ebook._id || ebook.id || index}
                className="astu-glass p-8 rounded-[3rem] border border-[var(--glass-border)] hover:border-indigo-500/40 transition-all group flex items-center gap-8 shadow-xl hover:shadow-indigo-500/5 group cursor-pointer bg-[var(--glass-bg)]/10"
                onClick={() => handleOpenEbook(ebook)}
              >
                <div className="h-28 w-20 overflow-hidden rounded-2xl bg-[var(--bg-main)] border border-[var(--glass-border)] shadow-2xl shrink-0 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700">
                   <img src={ebook.coverUrl || fallbackCovers[index % fallbackCovers.length]} className="h-full w-full object-cover" alt="Cover" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-black text-[var(--text-main)] line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors astu-title uppercase tracking-tighter italic leading-tight">
                    {ebook.title || "Advanced Protocol Logic"}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.4em] opacity-40 italic">Technical Archive Node</p>
                  <div className="pt-4 flex items-center gap-3 text-indigo-500 group-hover:translate-x-2 transition-transform">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Access Partition</span>
                     <SparklesIcon className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
