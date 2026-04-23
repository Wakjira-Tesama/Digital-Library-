import React, { useEffect, useState } from "react";
import {
  ComputerDesktopIcon,
  BookOpenIcon,
  ChartBarSquareIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import DashboardPage from "./DashboardPage";
import StudentDashboard from "./StudentDashboard";
import EbookStudentDashboard from "./EbookStudentDashboard";
import EbookStatsPage from "./EbookStatsPage";
import LibrarySelectionPage from "./LibrarySelectionPage";
import ThemeToggle from "../components/ThemeToggle";
import AIScholarDrawer from "../components/AIScholarDrawer";
import api from "../api";
import { SparklesIcon as SparklesIconSolid } from "@heroicons/react/24/solid";
import { SparklesIcon as SparklesIconOutline } from "@heroicons/react/24/outline";

export default function StudentCombinedDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLibraryId, setSelectedLibraryId] = useState(
    localStorage.getItem("selectedLibraryId"),
  );
  const [desktopNeedsLibrary, setDesktopNeedsLibrary] = useState(true);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const handleLibrarySelect = (libId) => {
    setSelectedLibraryId(libId);
    setDesktopNeedsLibrary(false);
    setActiveTab("desktops");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/me");
        setUser(res.data);
      } catch (err) {
        console.warn("Failed to load user profile", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(clock);
  }, []);

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-indigo-500/30 transition-colors duration-700 font-sans">
      {/* Truly Fixed Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-80 astu-glass border-r border-[var(--glass-border)] flex flex-col py-14 px-8 z-50 shadow-[40px_0_100px_-20px_rgba(0,0,0,0.08)] bg-[var(--glass-bg)]/80 backdrop-blur-3xl overflow-hidden group/sidebar">
        
        {/* Animated Background Pulse for Sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/[0.02] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        {/* Logo/Branding Section */}
        <div className="mb-20 px-2 flex items-center gap-5 group cursor-default relative">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative h-14 w-14 rounded-2xl astu-accent-gradient flex items-center justify-center p-0.5 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
               <div className="bg-white dark:bg-slate-900 h-full w-full rounded-[0.85rem] flex items-center justify-center shadow-inner overflow-hidden">
                  <img 
                    src="/astu-logo.jpg" 
                    alt="ASTU" 
                    className="w-9 h-9 rounded-full object-cover scale-110" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {!document.querySelector('img[alt="ASTU"]') && <CpuChipIcon className="h-6 w-6 text-indigo-500" />}
               </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black tracking-tighter text-[var(--text-main)] astu-title uppercase leading-none italic">ASTU Digital</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-500 font-black opacity-80 italic">Uplink Session</p>
          </div>
        </div>

        {/* Premium Navigation Menu */}
        <nav className="flex-1 space-y-3.5 relative">
          {[
            { id: "dashboard", label: "Sector Overview", icon: HomeIcon },
            { id: "digital", label: "Archival Vault", icon: BookOpenIcon },
            { id: "ai", label: "AI Scholar", icon: SparklesIconOutline },
            { id: "desktops", label: "Terminal Cluster", icon: ComputerDesktopIcon },
            { id: "stats", label: "Sync Analytics", icon: ChartBarSquareIcon },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "desktops") setDesktopNeedsLibrary(true);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center justify-between px-7 py-5.5 rounded-3xl transition-all duration-500 group/nav relative overflow-hidden active:scale-95
                ${activeTab === item.id 
                  ? "bg-indigo-600 dark:bg-indigo-600 text-white dark:text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] dark:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] scale-[1.03] z-10" 
                  : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 italic"}`}
            >
              {/* Active Tab Highlight Effect */}
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none rounded-3xl" />
              )}
              
              <div className="flex items-center gap-5 relative z-10">
                <item.icon className={`w-5.5 h-5.5 transition-all duration-500 ${activeTab === item.id ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-slate-400 group-hover/nav:text-indigo-500"}`} />
                <span className="font-extrabold text-[11px] uppercase tracking-[0.2em]">{item.label}</span>
              </div>
              
              {activeTab === item.id && (
                <div className="absolute right-6 h-2 w-2 rounded-full bg-white shadow-[0_0_15px_white] animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Controls & User Persistence */}
        <div className="mt-auto pt-10 border-t-2 border-[var(--glass-border)] space-y-10 relative">
          <div className="space-y-5">
             <div className="flex items-center justify-between px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 italic leading-none shadow-sm">Global Theme</span>
                <ThemeToggle />
             </div>
             
             <div className="astu-glass px-7 py-5 rounded-[2.2rem] border border-[var(--glass-border)] flex items-center gap-4 bg-[var(--bg-main)]/50 shadow-inner group/user-info hover:border-indigo-500/20 transition-all duration-500">
                <div className="h-10 w-10 rounded-xl astu-accent-gradient flex items-center justify-center p-0.5 shadow-lg group-hover/user-info:rotate-12 transition-transform duration-500">
                   <div className="bg-white dark:bg-slate-900 h-full w-full rounded-lg flex items-center justify-center text-[11px] font-black text-indigo-600 italic">
                     {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                   </div>
                </div>
                <div className="flex flex-col truncate">
                   <span className="text-[11px] font-black text-[var(--text-main)] italic uppercase truncate">{user?.name || "Verified Student"}</span>
                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-60">ID://UPLINK-ACT</span>
                </div>
             </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-5 px-7 py-5.5 rounded-3xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-[0.4em] group/out italic border border-transparent hover:border-red-500/20"
          >
            <div className="h-10 w-10 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--glass-border)] flex items-center justify-center group-hover/out:border-red-500/30 group-hover/out:text-red-500 transition-all shadow-sm">
               <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover/out:translate-x-1.5 transition-transform duration-500" />
            </div>
            <span>Terminal End</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Shifted with Margin and Balanced */}
      <main className="flex-1 ml-80 min-h-screen flex flex-col relative overflow-hidden bg-[var(--bg-main)] group/main font-sans">
        {/* Dynamic Multi-layered Ambient Glows */}
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-indigo-500/[0.03] blur-[200px] rounded-full -mr-[400px] -mt-[400px] pointer-events-none group-hover/main:bg-indigo-500/[0.05] transition-colors duration-[3s] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-violet-600/[0.02] blur-[180px] rounded-full -ml-[300px] -mb-[300px] pointer-events-none" />

        {activeTab !== "dashboard" && (
          <header className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] px-14 py-11 flex items-center justify-between sticky top-0 z-40 backdrop-blur-3xl transition-all duration-700 shadow-[0_8px_30px_rgb(15,23,42,0.02)] dark:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.02)]">
            <div className="space-y-2.5">
              <h2 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">
                {activeTab === "digital" ? "Archival Matrix" : 
                 activeTab === "ai" ? "Research Core" :
                 activeTab === "desktops" ? "Terminal Sector" : 
                 activeTab === "stats" ? "Sync Analytics" : "Command Center"}
              </h2>
              <div className="flex items-center gap-5">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
                 <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-500 font-black italic opacity-80 leading-none">
                   {selectedLibraryId ? "Node active // Partition Isolation 01" : "Uplink selection required"}
                 </p>
              </div>
            </div>

            <div className="flex items-center gap-14">
              <div className="hidden xl:flex flex-col items-end gap-2 px-8 border-r-2 border-[var(--glass-border)]">
                <span className="text-lg font-black text-[var(--text-main)] tracking-widest uppercase italic tabular-nums leading-none">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.6em] italic opacity-40 leading-none">Temporal Marker</span>
              </div>

              <div className="flex items-center gap-6 astu-glass px-8 py-3.5 rounded-[3rem] border-2 border-[var(--glass-border)] hover:border-indigo-500/30 transition-all cursor-default shadow-2xl bg-[var(--glass-bg)] hover:shadow-indigo-500/5 group/user-profile">
                <div className="relative">
                   <div className="absolute -inset-2.5 bg-indigo-500/30 blur-2xl rounded-full opacity-0 group-hover/user-profile:opacity-100 transition-opacity duration-1000" />
                   <div className="relative h-13 w-13 rounded-[1.4rem] astu-accent-gradient flex items-center justify-center p-0.5 shadow-2xl rotate-3 group-hover/user-profile:rotate-0 transition-transform duration-700">
                      <div className="bg-white dark:bg-slate-900 h-full w-full rounded-[1.25rem] flex items-center justify-center text-[14px] font-black text-indigo-500 italic shadow-inner">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                   </div>
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-black text-[var(--text-main)] leading-none italic uppercase tracking-tighter truncate max-w-[120px]">
                    {user?.name || "Operator-01"}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] mt-2 opacity-50 italic">Auth: Identity-Active</span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col z-10 custom-scrollbar overflow-y-auto">
          {activeTab === "dashboard" && <StudentDashboard />}
          {activeTab === "digital" && <EbookStudentDashboard embedded />}
          {activeTab === "ai" && <AIScholarDrawer embedded />}
          {activeTab === "desktops" &&
            (desktopNeedsLibrary || !selectedLibraryId ? (
              <LibrarySelectionPage onSelect={handleLibrarySelect} />
            ) : (
              <DashboardPage />
            ))}
          {activeTab === "stats" && <EbookStatsPage />}
        </div>
      </main>

      {/* Floating AI Assistant Activation */}
      <div className="fixed bottom-10 right-10 z-[60] group">
         <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />
         <button 
           onClick={() => setIsAiDrawerOpen(true)}
           className="relative h-20 w-20 rounded-[2.5rem] bg-indigo-600 text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] flex items-center justify-center border-4 border-white dark:border-slate-900 group-hover:scale-110 active:scale-90 transition-all duration-700 overflow-hidden"
         >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <SparklesIconSolid className="h-8 w-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
            
            {/* Pulsing indicator */}
            <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-[0_0_10px_#34d399]" />
         </button>
         
         {/* Label Tooltip */}
         <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-5 py-3 rounded-2xl bg-indigo-600/90 backdrop-blur-xl text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-700 pointer-events-none whitespace-nowrap italic shadow-2xl border border-white/20">
            AI Scholar Assistant
         </div>
      </div>

      <AIScholarDrawer 
        isOpen={isAiDrawerOpen} 
        onClose={() => setIsAiDrawerOpen(false)} 
      />
    </div>
  );
}
