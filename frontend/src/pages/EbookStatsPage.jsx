import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { FireIcon, ClockIcon, BookOpenIcon, ChartBarIcon, ArrowTrendingUpIcon, SparklesIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

const insights = [
  {
    title: "Archivist AI Logic",
    body: "Your cognitive synchronization peaks between 06:00 and 07:30. This temporal window yields 80% higher highlight retention.",
  },
  {
    title: "Thematic Shifts",
    body: "Focus on Technical Architecture has intensified by 45% this cycle, indicating a deep dive into structural systems.",
  },
  {
    title: "Predictive Archival",
    body: "Maintaining your current 12-day streak will complete your active research list 4 days ahead of the scheduled deadline.",
  },
];

export default function EbookStatsPage() {
  const [stats, setStats] = useState(null);
  const [shelfItems, setShelfItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, shelfRes] = await Promise.all([
        api.get("/api/ebook-user/stats"),
        api.get("/api/ebook-user/shelf").catch(() => null),
      ]);
      setStats(statsRes.data || null);
      setShelfItems(shelfRes?.data || []);
    } catch (err) {
      console.error("Failed to load stats", err);
      setError("Data link failure: Unable to synchronize personal metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  if (!stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] space-y-8 transition-colors duration-600 px-8 text-center">
        <div className="h-24 w-24 rounded-[2rem] bg-indigo-500/5 border border-[var(--glass-border)] flex items-center justify-center text-indigo-500/20 shadow-inner">
           <BookOpenIcon className="h-12 w-12" />
        </div>
        <div className="space-y-3">
           <p className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">Awaiting Data Integration</p>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60">Begin your first research cycle to generate behavioral metrics.</p>
        </div>
      </div>
    );
  }

  const monthlyProgress = stats.monthlyGoal
    ? Math.min(100, Math.round((stats.monthlyCompleted / stats.monthlyGoal) * 100))
    : 0;
  
  const shelfBooks = shelfItems.map((item) => item.ebook || item).filter(Boolean);
  const shelfHero = shelfBooks[0];
  const shelfCards = shelfBooks.slice(0, 3);
  const weeklyHours = Math.round((stats.readingMinutesThisWeek || 0) / 60);

  return (
    <div className="flex-1 bg-[var(--bg-main)]/50 text-[var(--text-main)] overflow-y-auto transition-colors duration-600 custom-scrollbar">
      <main className="max-w-7xl mx-auto px-8 py-16 space-y-20">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-12 relative overflow-hidden p-10 rounded-[4rem] astu-glass border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/20 shadow-2xl backdrop-blur-3xl group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none group-hover:bg-indigo-500/[0.05] transition-colors duration-1000" />
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-sm backdrop-blur-md">
              <ChartBarIcon className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">Cognitive Analytics Suite</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[var(--text-main)] astu-title tracking-tight leading-tight uppercase italic">
              Intellectual <span className="astu-accent-gradient bg-clip-text text-transparent italic">Momentum</span>
            </h1>
            <p className="text-[var(--text-muted)] text-xl max-w-3xl leading-relaxed italic font-medium opacity-80 uppercase tracking-tighter">
              A deep-space visualization of your research velocity and behavioral knowledge patterns.
            </p>
          </div>
          <div className="astu-glass px-10 py-6 rounded-3xl border border-[var(--glass-border)] text-right shrink-0 bg-[var(--bg-main)]/40 shadow-inner group-hover:border-indigo-500/20 transition-all">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-2 italic">Matrix State</p>
            <p className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none astu-title">SYSTEM_SYNC://ACTIVE</p>
          </div>
        </section>

        {error && (
          <div className="astu-glass border-red-500/30 bg-red-500/5 px-10 py-6 rounded-[2.5rem] text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.4em] flex items-center gap-5 shadow-2xl italic">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_red]" />
            CRITICAL_SYNC_FAILURE: {error}
          </div>
        )}

        {/* Top Level Metrics */}
        <section className="grid gap-10 md:grid-cols-3">
          <div className="astu-glass rounded-[3.5rem] p-10 border-2 border-[var(--glass-border)] relative overflow-hidden group shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl hover:scale-105 transition-all duration-700">
            <div className="absolute top-0 right-0 p-10 text-8xl font-black text-indigo-500/5 italic select-none group-hover:scale-125 transition-transform duration-1000">DAY</div>
            <div className="flex items-center gap-4">
              <FireIcon className="h-6 w-6 text-indigo-500" />
              <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic opacity-80">Research Streak</p>
            </div>
            <div className="mt-14 flex items-baseline gap-4">
              <span className="text-8xl font-black text-[var(--text-main)] tracking-tighter uppercase italic leading-none">{stats.readingStreakDays || 0}</span>
              <span className="text-[var(--text-muted)] text-sm font-black uppercase tracking-[0.3em] italic opacity-40">Cycles</span>
            </div>
            <p className="mt-8 text-[11px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] italic opacity-60 leading-relaxed">Continuous archival commitment across digital sectors.</p>
          </div>

          <div className="astu-glass rounded-[3.5rem] p-10 border-2 border-[var(--glass-border)] relative overflow-hidden group shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl hover:scale-105 transition-all duration-700">
            <div className="absolute top-0 right-0 p-10 text-8xl font-black text-indigo-500/5 italic select-none group-hover:scale-125 transition-transform duration-1000">HOUR</div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <ClockIcon className="h-6 w-6 text-indigo-500" />
                <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic opacity-80">Study Velocity</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
            </div>
            <div className="mt-14 flex items-baseline gap-4">
              <span className="text-8xl font-black text-[var(--text-main)] tracking-tighter uppercase italic leading-none">{weeklyHours}</span>
              <span className="text-[var(--text-muted)] text-sm font-black uppercase tracking-[0.3em] italic opacity-40">Hours</span>
            </div>
            <p className="mt-8 text-[11px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] italic opacity-60 leading-relaxed">Cumulative hours logged in the current temporal window.</p>
          </div>

          <div className="astu-glass rounded-[3.5rem] p-10 border-2 border-[var(--glass-border)] relative overflow-hidden group shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl hover:scale-105 transition-all duration-700">
            <div className="absolute top-0 right-0 p-10 text-8xl font-black text-indigo-500/5 italic select-none group-hover:scale-125 transition-transform duration-1000">GOAL</div>
            <div className="flex items-center gap-4">
              <BookOpenIcon className="h-6 w-6 text-indigo-500" />
              <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic opacity-80">Partition Success</p>
            </div>
            <div className="mt-14 flex items-baseline gap-6">
              <span className="text-6xl font-black text-[var(--text-main)] tracking-tighter italic uppercase leading-none">{stats.monthlyCompleted} / {stats.monthlyGoal}</span>
              <span className="text-indigo-600 dark:text-indigo-300 text-base font-black uppercase tracking-[0.4em] italic leading-none opacity-80">{monthlyProgress}%</span>
            </div>
            <div className="mt-10 h-2.5 w-full bg-[var(--glass-border)] rounded-full overflow-hidden border border-[var(--glass-border)] shadow-inner p-0.5">
              <div 
                className="h-full astu-accent-gradient shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000 rounded-full"
                style={{ width: `${monthlyProgress}%` }}
              />
            </div>
            <p className="mt-8 text-[11px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] italic opacity-60 leading-relaxed">Monthly knowledge target integration progress.</p>
          </div>
        </section>

        {/* Overview and Current Activity */}
        <section className="grid gap-12 lg:grid-cols-[1fr_450px]">
          <div className="astu-glass rounded-[4rem] p-14 border-2 border-[var(--glass-border)] space-y-14 shadow-2xl bg-[var(--glass-bg)]/30 backdrop-blur-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic">Sector Inventory</h2>
              <div className="flex items-center gap-3 px-5 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 shadow-sm">
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] italic">Deep Scan Active</span>
              </div>
            </div>
            <div className="grid gap-12 sm:grid-cols-2">
              {[
                { label: "Archival Starts", val: stats.totalBooks || 0, color: "indigo" },
                { label: "Cycles Finished", val: stats.completedBooks || 0, color: "emerald" },
                { label: "Private Vault", val: stats.shelfCount || 0, color: "violet" },
                { label: "Data Markers", val: stats.highlightCount || 0, color: "amber" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-10 group cursor-default">
                  <div className={`h-24 w-24 rounded-[2rem] bg-${stat.color}-600/10 border-2 border-${stat.color}-500/20 flex items-center justify-center text-3xl font-black text-[var(--text-main)] shadow-xl shadow-${stat.color}-500/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 italic group-hover:border-${stat.color}-500/40`}>
                    {stat.val}
                  </div>
                  <div className="space-y-1">
                     <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] italic group-hover:text-indigo-500 transition-colors">{stat.label}</p>
                     <p className="text-[10px] font-black text-indigo-500 italic uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-all">Verified Log Item</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.currentlyReading && (
            <div className="astu-glass rounded-[4.5rem] p-14 border-2 border-[var(--glass-border)] relative overflow-hidden group shadow-2xl flex flex-col justify-between bg-[var(--glass-bg)]/40 backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none group-hover:opacity-100 transition-opacity opacity-50" />
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_indigo]" />
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] italic">Active Uplink Node</p>
                </div>
                <h3 className="text-4xl font-black text-[var(--text-main)] astu-title leading-[1.1] line-clamp-3 uppercase tracking-tighter italic">
                  {stats.currentlyReading.ebook?.title || "Research Terminal"}
                </h3>
                <div className="flex items-center gap-4 pt-4">
                   <div className="h-[1px] w-12 bg-indigo-500/30" />
                   <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.3em] italic opacity-60">
                    By {stats.currentlyReading.ebook?.author || "Faculty Investigator"}
                   </p>
                </div>
              </div>
              
              <div className="space-y-6 my-14 relative z-10">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.5em] text-[var(--text-muted)] italic">
                  <span>{Math.round(stats.currentlyReading.progressPercent || 0)}% INTEGRATED</span>
                  <span className="text-indigo-600 dark:text-indigo-300">SECTOR_4.02</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--glass-border)] rounded-full overflow-hidden border border-[var(--glass-border)] shadow-inner p-0.5">
                  <div 
                    className="h-full astu-accent-gradient shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(stats.currentlyReading.progressPercent || 0))}%` }}
                  />
                </div>
              </div>
              
              <button className="astu-btn-premium w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.6em] text-white shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all italic flex items-center justify-center gap-4 group/btn">
                 <RocketLaunchIcon className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                 <span>Resume Uplink</span>
              </button>
            </div>
          )}
        </section>

        {/* AI Insights Section */}
        <section className="space-y-14">
          <div className="flex items-center gap-6 px-4">
             <div className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
             <div>
                <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">Synthesized Behavioral Logic</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-3 italic opacity-60">Machine-learned patterns for research optimization</p>
             </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {insights.map((item, index) => (
              <div
                key={item.title}
                className={`astu-glass p-10 rounded-[3.5rem] border border-[var(--glass-border)] relative group transition-all duration-700 hover:bg-indigo-600/5 border-l-[8px] shadow-xl hover:-translate-y-2 ${
                  index === 0 ? "border-l-indigo-600" : index === 1 ? "border-l-violet-600" : "border-l-indigo-400"
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition-opacity scale-75 group-hover:scale-100 duration-700">
                   <SparklesIcon className="h-20 w-20 text-indigo-500/20" />
                </div>
                <p className="text-[17px] text-[var(--text-main)] leading-relaxed italic mb-14 font-medium uppercase tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">“{item.body}”</p>
                <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-8">
                  <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] italic">
                    {item.title}
                  </p>
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <ArrowTrendingUpIcon className="h-3 w-3 text-indigo-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Private Vault Hero Upgrade */}
        <section className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 px-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">The Intellectual Void</h2>
              <p className="text-[var(--text-muted)] text-xl font-medium italic opacity-70 uppercase tracking-tighter">Your personalized sanctuary for high-end digital curation.</p>
            </div>
            <div className="flex flex-col items-end gap-2 pr-4">
               <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.6em] italic opacity-60">Archival Unit-04</span>
               <div className="h-[1px] w-24 bg-indigo-500/40" />
            </div>
          </div>

          <div className="grid gap-20 lg:grid-cols-[1fr_500px] items-center p-16 md:p-20 rounded-[5rem] astu-glass border-2 border-[var(--glass-border)] relative overflow-hidden group shadow-[0_60px_150px_-30px_rgba(0,0,0,0.15)] bg-[var(--glass-bg)]/20 backdrop-blur-3xl transition-all duration-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-transparent z-0 transition-opacity duration-1000 group-hover:opacity-100 opacity-60" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/[0.04] blur-[180px] rounded-full -mr-96 -mt-96 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative z-10 flex flex-col justify-center space-y-14">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] shadow-inner">
                   <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">Curated Partition</span>
                </div>
                <h3 className="text-4xl md:text-7xl font-black text-[var(--text-main)] astu-title tracking-tighter leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-100 transition-colors uppercase italic">
                  {shelfHero?.title || "Establish your archival legacy through standardizing inquiry."}
                </h3>
                <p className="mt-8 text-[var(--text-muted)] text-2xl leading-relaxed max-w-2xl italic font-medium opacity-80 uppercase tracking-tighter leading-relaxed">
                  "{shelfHero?.description || "The library is an infinite sphere whose center is any one of its hexagons and whose circumference is inaccessible."}"
                </p>
                <div className="pt-6 flex items-center gap-6">
                  <div className="h-[2px] w-20 bg-indigo-500/40" />
                  <p className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] italic shadow-sm">
                    {shelfHero?.author ? shelfHero.author : "Jorge Luis Borges"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-10 mt-6">
                <button className="astu-btn-premium px-16 py-6 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] text-white shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all italic flex items-center gap-5 group/main">
                  <span>Enter The Void</span>
                  <RocketLaunchIcon className="h-6 w-6 group-hover/main:rotate-12 transition-transform" />
                </button>
                <button className="px-12 py-6 rounded-[2.5rem] border-2 border-[var(--glass-border)] text-[11px] font-black text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/5 transition-all uppercase tracking-[0.4em] shadow-xl italic bg-[var(--bg-main)]/30 backdrop-blur-md">
                  Deep Archival Search
                </button>
              </div>
            </div>

            <div className="relative group/hero flex justify-center perspective-1000 hidden lg:flex">
               <div className="absolute -inset-24 bg-indigo-500/[0.15] blur-[120px] rounded-full opacity-0 group-hover/hero:opacity-100 transition-opacity duration-1000" />
               <div className="relative w-[400px] aspect-[3/4.4] rounded-[5rem] overflow-hidden shadow-[0_80px_200px_-40px_rgba(0,0,0,0.7)] border-4 border-white/5 bg-[var(--bg-main)] transform -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-1000">
                  <img
                    src={shelfHero?.coverUrl || "/covers/linear-algebra.svg"}
                    alt="Shelf Hero"
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000 opacity-90 group-hover:opacity-100 grayscale-[0.2] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
