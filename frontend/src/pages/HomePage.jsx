import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api";
import { 
  RocketLaunchIcon, 
  BookOpenIcon, 
  UserGroupIcon, 
  ArrowRightIcon, 
  CheckBadgeIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

const capacityRows = [
  {
    label: "Wing A - Ground Floor",
    value: "42/120 Desktops available",
    status: "Live Now",
    icon: <GlobeAltIcon className="h-4 w-4" />
  },
  {
    label: "Wing B - 1st Floor (Quiet Zone)",
    value: "18/80 Desktops available",
    status: "Live Now",
    icon: <AcademicCapIcon className="h-4 w-4" />
  },
  {
    label: "Graduate Commons - 2nd Floor",
    value: "28/40 Desktops available",
    status: "Live Now",
    icon: <UserGroupIcon className="h-4 w-4" />
  },
];

const serviceCards = [
  {
    title: "Focused sessions",
    body: "Pre-book your desktop for uninterrupted research and project work.",
    icon: <RocketLaunchIcon className="h-6 w-6 text-indigo-500" />,
    num: "01"
  },
  {
    title: "Print meets Digital",
    body: "Search the entire physical catalog and digital repository in one view.",
    icon: <BookOpenIcon className="h-6 w-6 text-indigo-500" />,
    num: "02"
  },
  {
    title: "More than desktops",
    body: "Book group study rooms, printing desks, and research support.",
    icon: <UserGroupIcon className="h-6 w-6 text-indigo-500" />,
    num: "03"
  },
];

const featuredCovers = [
  {
    src: "/covers/python.svg",
    title: "Sustainable Concrete Design",
    subtitle: "ASTU Civil Engineering Dept.",
  },
  {
    src: "/covers/physics.svg",
    title: "AI in Manufacturing",
    subtitle: "Dr. Samuel Kassa",
  },
  {
    src: "/covers/linear-algebra.svg",
    title: "Ethiopian Industrial History",
    subtitle: "Archives Section",
  },
  {
    src: "/covers/organic-chemistry.svg",
    title: "Ethics of Technology",
    subtitle: "Core Humanities Dept.",
  },
];

export default function HomePage() {
  const [searchResults, setSearchResults] = useState({ topMatches: [], relatedBooks: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ topMatches: [], relatedBooks: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get(`/api/ebooks/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data || { topMatches: [], relatedBooks: [] });
      setShowResults(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const hasResults = searchResults.topMatches?.length > 0 || searchResults.relatedBooks?.length > 0;
  return (
    <div className="min-h-screen text-[var(--text-main)] selection:bg-indigo-500/30 transition-colors duration-500">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500" />
              <img
                src="/astu-logo.png"
                alt="ASTU logo"
                className="relative h-12 w-12 rounded-2xl object-cover border border-[var(--glass-border)] shadow-xl transform group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">ASTU <span className="opacity-50 font-normal">Libris</span></p>
              <div className="flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[9px] tracking-wider text-indigo-500 font-semibold">
                   Archival · Pooling · Research
                 </p>
              </div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em]">
            {["Archive", "Pool Reservation", "Services"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(" ", "-")}`} 
                className="text-[var(--text-muted)] hover:text-indigo-500 dark:hover:text-white transition-all hover:translate-y-[-1px] italic"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Link
              to="/student"
              className="astu-btn-premium px-8 py-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wider text-white shadow-2xl shadow-indigo-500/20 active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-[var(--bg-main)]">
          <div className="absolute inset-0 z-0">
            <img 
              src="/premium-hero.png" 
              alt="Background" 
              className="w-full h-full object-cover opacity-40 dark:opacity-20 scale-110 animate-pulse blur-[2px]"
              style={{ animationDuration: '10s' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-main)]/95 to-transparent" />
            <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] rounded-full animate-pulse" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
            <div className="max-w-4xl astu-anim-in">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">New Digital Archive Live</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tight">
                Your <span className="font-bold text-[var(--text-main)]">Gateway</span> to the <br />
                <span className="astu-glow-text text-indigo-600 dark:text-white">Quantum Archive.</span>
              </h1>
              <p className="text-xl text-[var(--text-muted)] mb-12 leading-relaxed max-w-2xl font-normal opacity-80">
                Adama Science and Technology University's research ecosystem provides seamless access to 115k+ volumes and high-performance computing clusters.
              </p>
              
              <div className="relative mt-12 max-w-2xl group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                <div className="relative astu-glass flex items-center gap-3 px-6 py-4 rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-500">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <MagnifyingGlassIcon className={`h-5 w-5 ${isSearching ? "animate-spin" : ""}`} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowResults(true)}
                    placeholder="Search subject, title, or author..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-base font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                  />
                  <button className="astu-btn-premium px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                    Initialize Search
                  </button>
                </div>

                {/* Inline Search Results (Pushing content down) */}
                {showResults && hasResults && (
                  <div className="relative mt-8 p-8 astu-glass rounded-[2rem] border border-[var(--glass-border)] shadow-2xl z-20 animate-in fade-in slide-in-from-top-4 duration-700 max-h-[500px] overflow-y-auto custom-scrollbar backdrop-blur-3xl bg-[var(--glass-bg)]/95 w-full">
                    
                    {/* Primary Matches */}
                    {searchResults.topMatches?.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between px-4 mb-3">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Primary Matches</p>
                          <span className="text-[9px] font-black text-indigo-500/40 uppercase tracking-widest">{searchResults.topMatches.length} Found</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {searchResults.topMatches.map((book) => (
                            <Link
                              key={book.id || book._id}
                              to={`/ebook-viewer/${book.id || book._id}`}
                              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-500/5 border border-transparent hover:border-indigo-500/10 transition-all group/item"
                            >
                              <div className="h-16 w-11 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-[var(--glass-border)]">
                                <img src={book.coverUrl || "/covers/python.svg"} alt={book.title} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight truncate group-hover/item:text-indigo-500 transition-colors leading-tight">
                                  {book.title}
                                </h4>
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic truncate mt-0.5">
                                  {book.author}
                                </p>
                                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                                  {Math.round((book.score / 20) * 100) || 95}% Match
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Discoveries */}
                    {searchResults.relatedBooks?.length > 0 && (
                      <div className="pt-6 border-t border-[var(--glass-border)]">
                        <div className="flex items-center justify-between px-4 mb-3">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic">Related Discoveries</p>
                          <span className="text-[9px] font-black text-rose-500/40 uppercase tracking-widest">Recommended</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {searchResults.relatedBooks.map((book) => (
                            <Link
                              key={book.id || book._id}
                              to={`/ebook-viewer/${book.id || book._id}`}
                              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all group/item"
                            >
                              <div className="h-12 w-9 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-[var(--glass-border)] opacity-80 group-hover/item:opacity-100 transition-opacity">
                                <img src={book.coverUrl || "/covers/python.svg"} alt={book.title} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate group-hover/item:text-rose-500 transition-colors leading-tight">
                                  {book.title}
                                </h4>
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic truncate mt-0.5">
                                  In '{book.category}'
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 px-4 pt-4 border-t border-[var(--glass-border)] flex justify-center">
                      <button onClick={() => { setShowResults(false); setSearchQuery(""); }} className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] hover:text-rose-500 transition-colors italic group flex items-center gap-2">
                         Clear Search Uplink
                         <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                )}

                {showResults && searchQuery && !hasResults && !isSearching && (
                  <div className="relative mt-8 p-10 astu-glass rounded-[2rem] border border-rose-500/30 shadow-2xl z-20 text-center animate-in fade-in zoom-in duration-500 bg-rose-500/5 backdrop-blur-3xl w-full">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic mb-4">No neural matches detected for this sequence.</p>
                     <button onClick={() => { setShowResults(false); setSearchQuery(""); }} className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-white transition-colors border border-[var(--glass-border)] px-4 py-2 rounded-full">Reset Query</button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-6 mt-12">
                <button className="astu-btn-premium px-10 py-5 rounded-2xl text-[11px] font-semibold uppercase tracking-wider text-white shadow-2xl shadow-indigo-500/30 flex items-center gap-3 group">
                  Explore Repository
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  to="/student"
                  className="px-10 py-5 rounded-2xl text-[11px] font-semibold border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-white/80 active:scale-95 transition-all text-[var(--text-main)] uppercase tracking-wider shadow-lg"
                >
                  Student Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[var(--bg-main)] to-transparent z-20" />
        </section>

        {/* Desktop Pooling Section */}
        <section id="pool-reservation" className="max-w-7xl mx-auto px-6 py-32 relative">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="grid gap-20 lg:grid-cols-2 items-center">
            <div className="astu-anim-in space-y-10">
              <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-6 italic">
                  Infrastructure
                </p>
                <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight leading-none">
                  High Performance <br />
                  <span className="text-indigo-600 dark:text-white">Node Pooling</span>
                </h2>
                <p className="text-[var(--text-muted)] text-xl mb-8 leading-relaxed font-normal opacity-80">
                  Maximize productivity with intelligent workspace allocation. Secure high-performance clusters instantly across all wings.
                </p>
              </div>
              
              <div className="grid gap-6">
                {[
                  "Optimized Research Terminals",
                  "Identity-Based Encryption Keys",
                  "Real-time Mesh Monitoring"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-5 group">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-500 shadow-xl group-hover:scale-110">
                      <CheckBadgeIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <span className="text-[var(--text-main)] font-black text-sm uppercase tracking-[0.1em] italic">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/student"
                className="astu-btn-premium px-10 py-5 rounded-2xl text-[11px] font-semibold uppercase tracking-wider text-white shadow-xl shadow-indigo-500/20 flex items-center gap-3 w-fit"
              >
                Access Status Matrix
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="astu-glass rounded-[4rem] p-1.5 overflow-hidden relative group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-[3.8rem] bg-[var(--bg-main)]/60 backdrop-blur-3xl p-10 pt-12">
                <div className="flex items-center justify-between mb-12 pb-8 border-b border-[var(--glass-border)]">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                      <ComputerDesktopIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[var(--text-main)] mb-1 astu-title uppercase tracking-tighter">Node Discovery</h4>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] italic">Mesh Network Status</p>
                    </div>
                  </div>
                  <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Active</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {capacityRows.map((row) => (
                    <div key={row.label} className="astu-glass rounded-3xl p-8 astu-glass-hover border-[var(--glass-border)] group/row">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-4 text-indigo-500">
                          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover/row:scale-110 transition-transform">
                            {row.icon}
                          </div>
                          <span className="text-base font-black text-[var(--text-main)] uppercase tracking-tight italic">{row.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">{row.status}</span>
                      </div>
                      <div className="w-full h-3 bg-indigo-500/5 dark:bg-slate-950 rounded-full overflow-hidden mb-4 shadow-inner">
                        <div 
                          className="h-full astu-accent-gradient shadow-[0_0_15px_rgba(99,102,241,0.6)] rounded-full transition-all duration-1000" 
                          style={{ width: `${(parseInt(row.value.split('/')[0]) / parseInt(row.value.split('/')[1])) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">
                        <span>CAPACITY LOAD</span>
                        <span className="text-indigo-600 dark:text-indigo-400 italic text-[12px] font-black leading-none">{row.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="relative py-32 overflow-hidden border-y border-[var(--glass-border)] bg-[var(--bg-main)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glass-bg),transparent)] opacity-50" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-24">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-6 italic">
                Ecosystem Services
              </p>
              <h3 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight leading-[0.85]">
                Tools built for the <br />
                <span className="text-indigo-600 dark:text-white">ASTU Community.</span>
              </h3>
              <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-xl leading-relaxed font-normal opacity-80">
                Bridging the gap between physical research and digital discovery with a premium experience designed for elite scientists.
              </p>
            </div>
            
            <div className="grid gap-10 md:grid-cols-3">
              {serviceCards.map((card, idx) => (
                <div
                  key={card.title}
                  className="astu-glass p-12 rounded-[3.5rem] border-[var(--glass-border)] astu-glass-hover relative group flex flex-col h-full bg-[var(--glass-bg)]/40"
                >
                  <div className="absolute top-0 right-0 p-10 text-9xl font-black text-indigo-500 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 italic group-hover:translate-x-4">
                    {card.num}
                  </div>
                  <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 mb-10 flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {card.icon}
                  </div>
                  <h4 className="text-2xl font-black text-[var(--text-main)] mb-6 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors astu-title uppercase tracking-tight">
                    {card.title}
                  </h4>
                  <p className="text-[var(--text-muted)] leading-relaxed text-base font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">
                    {card.body}
                  </p>
                  
                  <div className="mt-auto pt-10">
                    <button className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 flex items-center gap-2 group/btn italic">
                      Initialize Service <ArrowRightIcon className="h-3 w-3 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Archive Section */}
        <section id="archive" className="max-w-7xl mx-auto px-6 py-32 relative">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">
                Knowledge Base
              </p>
              <h3 className="text-5xl font-black astu-title uppercase tracking-tighter">
                Featured <span className="text-indigo-600 dark:text-white italic">Publications.</span>
              </h3>
            </div>
            <button className="px-8 py-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center gap-3 italic shadow-lg">
              Discover All Units <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCovers.map((cover) => (
              <div
                key={cover.title}
                className="astu-glass rounded-[4rem] overflow-hidden group cursor-pointer border-[var(--glass-border)] hover:border-indigo-500/40 transition-all shadow-2xl bg-[var(--glass-bg)]/20"
              >
                <div className="relative h-80 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <img
                    src={cover.src}
                    alt={cover.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2"
                  />
                  <div className="absolute bottom-6 left-6 z-20">
                    <span className="px-5 py-2 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-xl text-[9px] font-black text-indigo-600 border border-indigo-500/30 uppercase tracking-[0.3em] shadow-2xl italic">Peer Reviewed</span>
                  </div>
                </div>
                <div className="p-10">
                  <h4 className="text-base font-black text-[var(--text-main)] mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 astu-title uppercase tracking-tight italic">
                    {cover.title}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] opacity-60 italic">{cover.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interior Highlight Section */}
        <section className="relative py-32 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid gap-20 lg:grid-cols-2 items-center">
              <div className="relative group p-6">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-all duration-1000" />
                <div className="relative rounded-[4.5rem] p-2 bg-gradient-to-br from-[var(--glass-border)] to-transparent z-10 shadow-2xl overflow-hidden">
                   <img 
                    src="/premium-feature.png" 
                    className="relative rounded-[4rem] border border-[var(--glass-border)] shadow-inner object-cover h-[600px] w-full z-10 transition-transform duration-1000 group-hover:scale-[1.02]"
                    alt="Library Interior"
                   />
                </div>
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-[3rem] bg-emerald-500/20 backdrop-blur-3xl z-20 shadow-2xl animate-bounce flex items-center justify-center p-8 text-emerald-600 rotate-12" style={{ animationDuration: '4s' }}>
                   <RocketLaunchIcon className="h-full w-full" />
                </div>
              </div>

              <div className="astu-anim-in space-y-10">
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-6 italic">
                    Research Spaces
                  </p>
                  <h3 className="text-5xl md:text-7xl font-black mb-8 astu-title uppercase tracking-tighter leading-[0.85]">
                    Designed for <br />
                    <span className="text-indigo-600 dark:text-white italic">Innovation Mesh.</span>
                  </h3>
                  <p className="text-[var(--text-muted)] text-xl mb-12 leading-relaxed font-black uppercase tracking-tight italic opacity-40">
                    ASTU LIBRIS: High Energy Research Environments.
                  </p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { label: "115k Volumes", desc: "Scientific Archives", icon: <BookOpenIcon className="h-4 w-4" /> },
                    { label: "Mesh Clusters", desc: "Technical Node Pooling", icon: <ComputerDesktopIcon className="h-4 w-4" /> },
                    { label: "24/7 Portal", desc: "Global Discovery Layer", icon: <GlobeAltIcon className="h-4 w-4" /> },
                    { label: "Quiet Mesh", desc: "Deep Focused Study", icon: <CheckBadgeIcon className="h-4 w-4" /> }
                  ].map((item) => (
                    <div key={item.label} className="astu-glass p-8 rounded-[2.5rem] border-[var(--glass-border)] astu-glass-hover bg-[var(--glass-bg)]/20">
                      <div className="h-10 w-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 shadow-xl shadow-indigo-500/5">
                         {item.icon}
                      </div>
                      <p className="text-lg font-black text-[var(--text-main)] mb-2 astu-title uppercase tracking-tight italic">{item.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] italic">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] bg-[var(--bg-main)] py-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[200px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-sm text-[var(--text-muted)] relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-24 mb-24">
            <div className="space-y-10 max-w-md">
              <div className="space-y-4">
                <p className="text-5xl font-bold uppercase tracking-tight leading-none">ASTU <br/> <span className="text-indigo-600">LIBRIS.</span></p>
                <div className="space-y-2 font-normal text-[10px] uppercase tracking-wider">
                   <p className="text-[var(--text-main)]">Adama Science and Technology University</p>
                   <p className="text-indigo-500 opacity-60">Research & Archival Governance Wing</p>
                </div>
              </div>
              <p className="text-[var(--text-muted)] font-normal leading-relaxed opacity-70">
                The official metadata discovery and resource allocation layer for the Adama Science and Technology University ecosystem.
              </p>
              <p className="text-[9px] mt-12 font-black uppercase tracking-[0.5em] opacity-30 italic">© {new Date().getFullYear()} CORE ARCHIVES PROTOCOL</p>
            </div>
            
            <div className="flex flex-wrap gap-24">
              <div className="space-y-10">
                <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.5em] italic">Foundational</p>
                <div className="flex flex-col gap-6 text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Mesh Repository</span>
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Cluster Pooling</span>
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Node Analytics</span>
                </div>
              </div>
              <div className="space-y-10">
                <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.5em] italic">Governance</p>
                <div className="flex flex-col gap-6 text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Access Protocol</span>
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Identity Mesh</span>
                  <span className="hover:text-indigo-600 transition-all cursor-pointer hover:translate-x-3">Libris Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
