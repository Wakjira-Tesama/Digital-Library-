import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { 
  BookOpenIcon, 
  MagnifyingGlassIcon,
  BoltIcon,
  CogIcon,
  VariableIcon,
  ComputerDesktopIcon,
  BeakerIcon,
  CalculatorIcon,
  RocketLaunchIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  FireIcon
} from "@heroicons/react/24/outline";


export default function EbookStudentDashboard({ embedded = false }) {
  const [ebooks, setEbooks] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const loadInitial = useCallback(async () => {
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
      console.error("Failed to load ebook dashboard", err);
      setError("Failed to load digital library. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handleSearch = async (event) => {
    event?.preventDefault();
    setSearching(true);
    setError("");
    try {
      const res = await api.get("/api/ebooks/search", {
        params: {
          q: query || undefined,
        },
      });
      // Backend now returns { topMatches, relatedBooks }
      const results = res.data?.topMatches || [];
      const related = res.data?.relatedBooks || [];
      setEbooks([...results, ...related]);
    } catch (err) {
      console.error("Search failed", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

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
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(ebooks.map(e => e.category).filter(Boolean));
    return ["All", ...Array.from(cats)].sort();
  }, [ebooks]);

  const categoryIcons = {
    "All": <BuildingLibraryIcon className="h-5 w-5" />,
    "Electrical Engineering": <BoltIcon className="h-5 w-5" />,
    "Mechanical Engineering": <CogIcon className="h-5 w-5" />,
    "Applied Physics": <VariableIcon className="h-5 w-5" />,
    "Engineering Mathematics": <CalculatorIcon className="h-5 w-5" />,
    "Aerospace Engineering": <RocketLaunchIcon className="h-5 w-5" />,
    "Computer Science (Logic)": <ComputerDesktopIcon className="h-5 w-5" />,
    "Computer Science History": <GlobeAltIcon className="h-5 w-5" />,
    "Applied Mathematics": <CalculatorIcon className="h-5 w-5" />,
    "Civil Engineering": <AcademicCapIcon className="h-5 w-5" />,
    "Environmental Engineering": <GlobeAltIcon className="h-5 w-5" />,
    "Chemical Engineering": <FireIcon className="h-5 w-5" />,
    "Chemistry": <BeakerIcon className="h-5 w-5" />,
    "Applied Science": <AcademicCapIcon className="h-5 w-5" />,
    "General": <BookOpenIcon className="h-5 w-5" />
  };

  const filteredEbooks = useMemo(() => {
    let list = Array.isArray(ebooks) ? [...ebooks] : [];
    if (selectedCategory !== "All") {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e => 
        e.title?.toLowerCase().includes(q) || 
        e.author?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ebooks, selectedCategory, query]);

  const topEbooks = useMemo(() => {
    const list = Array.isArray(ebooks) ? [...ebooks] : [];
    return list
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 10);
  }, [ebooks]);

  const coverPool = useMemo(
    () => ebooks.map((ebook) => ebook.coverUrl).filter(Boolean),
    [ebooks],
  );

  const newArrivals = useMemo(() => ebooks.slice(0, 2), [ebooks]);
  const curated = useMemo(() => ebooks.slice(2, 4), [ebooks]);
  
  const fallbackCovers = ["/covers/organic-chemistry.svg"];
  const currentReading = stats?.currentlyReading?.ebook;
  const currentProgress = Math.round(
    stats?.currentlyReading?.progressPercent || 0,
  );
  const pagesRead = stats?.currentlyReading?.pagesRead;
  const totalPages = stats?.currentlyReading?.pageCount;
  const progressRight =
    pagesRead && totalPages ? `${pagesRead} of ${totalPages} Pages` : "";
  const fallbackTitle = "A Textbook of Chemistry for Engineers";
  const fallbackSubtitle =
    "Chapter 4: Thermodynamics and Phase Equilibria. Continue where you left off at page 142.";
  const displayTitle = currentReading?.title || fallbackTitle;
  const currentSubtitle = currentReading?.description || fallbackSubtitle;
  const displayProgress = currentReading ? currentProgress : 45;
  const displayProgressRight = progressRight || "186 of 412 Pages";
  const coverFallback = coverPool[0] || "/covers/organic-chemistry.svg";
  
  const monthlyCompleted = stats?.monthlyCompleted || 0;
  const monthlyGoal = stats?.monthlyGoal || 5;
  const monthlyProgress = monthlyGoal
    ? Math.min(100, Math.round((monthlyCompleted / monthlyGoal) * 100))
    : 0;

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'h-full bg-transparent' : 'min-h-screen bg-[var(--bg-main)]'} transition-colors duration-500`}>
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const mainContent = (
    <main className="max-w-7xl mx-auto px-8 pb-20 space-y-16">
      <section className="pt-16 pb-8 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">Knowledge Infrastructure</p>
            <h1 className="text-6xl md:text-8xl font-black text-[var(--text-main)] astu-title tracking-tighter leading-[0.9] uppercase italic">
              Digital <br />
              <span className="astu-accent-gradient bg-clip-text text-transparent not-italic">Preservation.</span>
            </h1>
          </div>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto group px-4">
            <div className="relative flex items-center p-2 rounded-[3rem] astu-glass border border-[var(--glass-border)] shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-700 bg-[var(--glass-bg)]/80 backdrop-blur-2xl">
              <div className="pl-8 text-indigo-500/50">
                <MagnifyingGlassIcon className={`h-6 w-6 ${searching ? "animate-spin" : ""}`} />
              </div>
              <input
                type="text"
                placeholder="Initialize global repository discovery..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder:text-[var(--text-muted)] px-6 text-base font-black uppercase tracking-wider italic"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={searching}
                className="astu-btn-premium px-12 py-4.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-4 shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all"
              >
                {searching ? "Indexing..." : "EXECUTE"}
              </button>
            </div>
          </form>

          {/* New Categories Section */}
          <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-wrap justify-center gap-4">
               {categories.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 text-[10px] font-black uppercase tracking-widest italic group ${
                     selectedCategory === cat 
                     ? 'bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/20 scale-105' 
                     : 'astu-glass border-[var(--glass-border)] text-[var(--text-muted)] hover:border-indigo-500/50 hover:text-indigo-500 hover:translate-y-[-2px]'
                   }`}
                 >
                   <div className={`${selectedCategory === cat ? 'text-white' : 'text-indigo-500'} group-hover:scale-110 transition-transform`}>
                     {categoryIcons[cat] || categoryIcons["General"]}
                   </div>
                   {cat}
                 </button>
               ))}
            </div>
          </div>
          
          {error && (
            <div className="text-[10px] font-black text-red-500 bg-red-500/5 px-8 py-3 rounded-full border border-red-500/10 inline-block uppercase tracking-widest italic animate-bounce">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Most Popular Carousel */}
      <section className="space-y-10 group">
        <div className="flex items-end justify-between px-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic">Neural Network Top Picks</p>
            <h2 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Most <span className="italic-accent italic text-indigo-600 dark:text-white">Popular</span></h2>
          </div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">Swipe to Explore Repository</p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex gap-8 overflow-x-auto pb-12 pt-4 px-4 no-scrollbar cursor-grab active:cursor-grabbing snap-x">
            {topEbooks.map((ebook, idx) => (
              <div
                key={ebook._id || ebook.id || idx}
                onClick={() => handleOpenEbook(ebook)}
                className="flex-shrink-0 w-72 snap-start astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] astu-glass-hover shadow-2xl relative group/card"
              >
                <div className="absolute top-6 right-6 text-4xl opacity-[0.05] font-black italic group-hover/card:opacity-20 transition-opacity">0{idx + 1}</div>
                <div className="aspect-[3/4.5] rounded-[2.5rem] overflow-hidden border border-[var(--glass-border)] mb-8 shadow-2xl transform group-hover/card:scale-[1.03] transition-transform duration-700">
                  <img src={ebook.coverUrl || "/covers/python.svg"} alt={ebook.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3">
                   <div className="h-1 w-8 bg-indigo-500 rounded-full mb-4" />
                   <h3 className="text-base font-black text-[var(--text-main)] line-clamp-1 uppercase tracking-tight astu-title">{ebook.title}</h3>
                   <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic line-clamp-1">{ebook.author}</p>
                   <div className="flex items-center gap-2 pt-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{ebook.popularityScore || 0} ACCESS SESSIONS</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="astu-glass rounded-[3rem] p-10 border border-[var(--glass-border)] relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 z-0">
          {(currentReading?.coverUrl || coverFallback) && (
            <>
              <div className="absolute inset-0 bg-[var(--bg-main)]/70 z-10" />
              <img 
                src={currentReading?.coverUrl || coverFallback} 
                alt="Backdrop" 
                className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-[var(--bg-main)]/50 z-0" />
        </div>

        <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_320px] items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Academic Session Live</span>
            </div>
            
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-main)] astu-title leading-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                {displayTitle}
              </h2>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-2xl italic font-medium">
                {currentSubtitle}
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <span className="flex items-center gap-2">
                  <span className="text-indigo-500">{displayProgress}%</span> RESEARCH COMPLETION
                </span>
                <span className="text-indigo-600 dark:text-slate-300 font-black">{displayProgressRight}</span>
              </div>
              <div className="h-2 w-full bg-[var(--glass-border)] rounded-full overflow-hidden border border-[var(--glass-border)]">
                <div 
                  className="h-full astu-accent-gradient shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, displayProgress)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenEbook(currentReading)}
              className="astu-btn-premium px-12 py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl flex items-center gap-4 group/btn"
            >
              <span>Resume Repository Focus</span>
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:bg-white/30 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </button>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative group/cover">
              <div className="absolute -inset-6 bg-indigo-500/15 blur-3xl rounded-[3rem] opacity-0 group-hover/cover:opacity-100 transition-opacity" />
              <div className="relative w-64 aspect-[3/4.5] rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-[var(--glass-border)] transform rotate-3 group-hover:rotate-0 transition-transform duration-700 bg-[var(--bg-main)]">
                {(currentReading?.coverUrl || coverFallback) ? (
                  <img
                    src={currentReading?.coverUrl || coverFallback}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full astu-accent-gradient opacity-20" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <div className="flex items-end justify-between px-2">
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Discovery Matrix</p>
              <h3 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                {selectedCategory === "All" ? "Global Repository" : `${selectedCategory}`}
                <span className="opacity-30 ml-4 font-thin italic">[{filteredEbooks.length}]</span>
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setSelectedCategory("All"); setQuery(""); }}
                className="text-[10px] font-black text-[var(--text-muted)] hover:text-rose-500 transition-all uppercase tracking-[0.2em] italic underline decoration-transparent hover:decoration-rose-500 underline-offset-8"
              >
                Reset Grid
              </button>
            </div>
          </div>
          
          {filteredEbooks.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEbooks.map((ebook, index) => (
                <div
                  key={ebook._id || ebook.id || index}
                  className="astu-glass p-6 rounded-[3rem] border border-[var(--glass-border)] astu-glass-hover group cursor-pointer shadow-xl relative overflow-hidden flex flex-col"
                  onClick={() => handleOpenEbook(ebook)}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative aspect-[3/4.2] overflow-hidden rounded-[2rem] bg-[var(--bg-main)] border border-[var(--glass-border)] shadow-2xl transition-all duration-700 group-hover:rotate-1 group-hover:scale-[1.02]">
                    <img
                      src={ebook.coverUrl || "/covers/python.svg"}
                      alt="Cover"
                      className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute top-4 left-4">
                       <span className="px-4 py-1.5 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-xl text-[8px] font-black text-indigo-500 border border-indigo-500/20 uppercase tracking-widest italic shadow-2xl">
                         {ebook.category || "General"}
                       </span>
                    </div>
                  </div>
                  
                  <div className="mt-8 px-2 space-y-3 flex-1">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] italic mb-1">Archival Node</p>
                    <h4 className="text-lg font-black text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors line-clamp-2 astu-title uppercase tracking-tight leading-tight">
                      {ebook.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-widest italic opacity-60">
                      {ebook.author}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[var(--glass-border)] flex items-center justify-between">
                     <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">Rank #{index + 1}</span>
                     <button className="h-10 w-10 rounded-xl bg-indigo-500/5 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg active:scale-90">
                        <BookOpenIcon className="h-5 w-5" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center astu-glass rounded-[3rem] border border-dashed border-[var(--glass-border)]">
               <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em] italic">No neural nodes detected for the current filter.</p>
               <button onClick={() => { setSelectedCategory("All"); setQuery(""); }} className="mt-6 text-[11px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-1">Reset Uplink</button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="astu-glass rounded-[2.5rem] p-8 border border-[var(--glass-border)] relative overflow-hidden group shadow-xl">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="text-indigo-400">⚡</span> Focus Node
              </p>
              <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="aspect-[3/4.2] w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)] relative group/cover">
                 {/* Use a cover from the pool, ideally something visually striking */}
                 <img src={coverPool[0] || fallbackCovers[0]} alt="Featured Theme" className="w-full h-full object-cover transform group-hover/cover:scale-105 transition-transform duration-700 filter group-hover/cover:brightness-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/20 to-transparent opacity-90" />
                 <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 mb-3 inline-block">Staff Pick</span>
                    <h4 className="text-lg font-extrabold text-white leading-tight drop-shadow-xl astu-title">Algorithmic Systems</h4>
                 </div>
              </div>
              
              <button className="w-full py-4 rounded-[1.25rem] astu-accent-gradient text-[10px] font-black text-white hover:shadow-2xl hover:shadow-indigo-500/40 transition-all uppercase tracking-[0.3em] active:scale-[0.98] border border-white/10 relative overflow-hidden group/btn">
                <span className="relative z-10">Initiate Uplink</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="astu-glass rounded-[2.5rem] p-8 border border-[var(--glass-border)] relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-4 text-4xl opacity-[0.03] grayscale transition-all group-hover:grayscale-0 group-hover:opacity-10 group-hover:scale-110">📖</div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Reading Velocity</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-extrabold text-[var(--text-main)] tracking-tighter">{monthlyCompleted}</span>
              <span className="text-[var(--text-muted)] text-sm font-black uppercase tracking-widest">/ {monthlyGoal}</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--glass-border)] rounded-full overflow-hidden mb-6 shadow-inner">
              <div 
                className="h-full astu-accent-gradient shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                style={{ width: `${monthlyProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-tight italic">
              You are among the <span className="text-indigo-500">Top 5%</span> of ASTU researchers this term.
            </p>
          </div>
        </div>
      </section>

      <section className="astu-glass rounded-[3rem] p-12 border border-[var(--glass-border)] relative overflow-hidden shadow-2xl">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="grid gap-16 lg:grid-cols-2 relative z-10">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[var(--text-main)] astu-title">Recent Acquisitions</h3>
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 uppercase tracking-[0.2em] shadow-sm">June 2024 Index</span>
            </div>
            
            <div className="space-y-5">
              {newArrivals.map((ebook, index) => (
                <div
                  key={ebook._id || ebook.id || index}
                  className="flex items-center gap-6 p-5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-indigo-500/30 transition-all group shadow-sm hover:shadow-xl"
                >
                  <div className="h-24 w-18 rounded-xl overflow-hidden shadow-2xl border border-[var(--glass-border)] bg-[var(--bg-main)] shrink-0 transform group-hover:scale-105 transition-transform">
                    <img
                      src={ebook.coverUrl || coverPool[index % coverPool.length] || fallbackCovers[index % fallbackCovers.length]}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Peer Reviewed Journal</p>
                    <p className="text-base font-bold text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-white transition-colors astu-title line-clamp-1">{ebook.title || "Current Research Trends"}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 font-medium italic">Academic Press · Special Edition Track</p>
                  </div>
                  <button type="button" onClick={() => handleOpenEbook(ebook)} className="p-4 rounded-full bg-indigo-500/5 text-slate-400 hover:text-white hover:bg-indigo-500 transition-all shadow-md group/icon">
                    <BookOpenIcon className="h-5 w-5 transform group-hover/icon:scale-110" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-[1.25rem] astu-accent-gradient flex items-center justify-center text-xl font-black text-white shadow-2xl shadow-indigo-500/30">
                AI
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[var(--text-main)] astu-title">Knowledge Tracks</h3>
                <p className="text-sm text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Algorithmic mapping for Computer Science</p>
              </div>
            </div>

            <div className="grid gap-6">
              {curated.map((ebook, index) => (
                <div
                  key={ebook._id || ebook.id || index}
                  className="flex items-center gap-6 p-6 rounded-[2.5rem] astu-glass border border-[var(--glass-border)] hover:bg-indigo-500/5 transition-all group shadow-md hover:shadow-2xl cursor-pointer"
                  onClick={() => handleOpenEbook(ebook)}
                >
                  <div className="h-20 w-14 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-main)] shrink-0 transform group-hover:scale-110 transition-transform shadow-lg">
                    <img
                      src={ebook.coverUrl || coverPool[index % coverPool.length] || fallbackCovers[index % fallbackCovers.length]}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-main)] mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{ebook.title || "Computational Logic"}</p>
                    <p className="text-[11px] text-[var(--text-muted)] uppercase font-black tracking-tighter opacity-60">Advanced Track · Foundational</p>
                    <button type="button" className="mt-4 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors flex items-center gap-2 group/btn">
                      Sync to Workspace <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );

  if (embedded) {
    return (
      <div className="flex-1 bg-[var(--bg-main)]/50 text-[var(--text-main)] overflow-y-auto transition-colors duration-500">
        {mainContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col selection:bg-indigo-500/30 transition-colors duration-500">
      <header className="astu-glass border-b border-[var(--glass-border)] px-8 py-5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl transition-colors duration-500">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full" />
            <BookOpenIcon className="relative h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-[var(--text-main)] tracking-tight astu-title">ASTU Digital Library</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-black italic">Research Repository</p>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-10">
          {["Collections", "Archival Rooms", "Research Hub", "Network"].map((item) => (
            <button key={item} className="text-[10px] font-black text-[var(--text-muted)] hover:text-indigo-500 dark:hover:text-white transition-all uppercase tracking-[0.2em]">
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-8">
          <Link
            to="/student"
            className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all italic underline decoration-indigo-500/20 underline-offset-8"
          >
            Digital Terminal
          </Link>
          <div className="h-10 w-10 rounded-xl astu-accent-gradient border border-[var(--glass-border)] shadow-xl shadow-indigo-500/20" />
        </div>
      </header>

      <div className="flex-1">
        {mainContent}
      </div>

      <footer className="mt-auto border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-2xl transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-10 py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-16 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl astu-accent-gradient shadow-lg" />
                 <div>
                   <p className="text-xl font-extrabold text-[var(--text-main)] astu-title">ASTU Digital Library</p>
                   <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">Official Research Archive</p>
                 </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold italic leading-relaxed">Standardizing technical research discovery <br className="hidden lg:block" /> for the Adama Science and Technology University ecosystem.</p>
            </div>
            <div className="flex flex-wrap items-center gap-10 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
              {["Faculty", "Research", "Compliance", "Security", "Support"].map(link => (
                <span key={link} className="hover:text-indigo-500 cursor-pointer transition-colors hover:translate-y-[-2px]">{link}</span>
              ))}
            </div>
          </div>
          <div className="pt-10 border-t border-[var(--glass-border)] flex flex-col md:flex-row justify-between items-center gap-6">
             <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-60">© {new Date().getFullYear()} ASTU Digital Architecture. All vectors verified.</p>
             <div className="flex items-center gap-6">
                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-indigo-500/10 bg-indigo-500/5 shadow-sm">Core v2.4.9</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
