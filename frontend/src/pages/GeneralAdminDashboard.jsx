import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import GeneralAdminLayout from "../components/GeneralAdminLayout";
import {
  ShieldCheckIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ServerStackIcon,
  SignalIcon,
  BoltIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

export default function GeneralAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [topReadBooks, setTopReadBooks] = useState([]);
  const [librarians, setLibrarians] = useState([]);
  const [desktops, setDesktops] = useState([]);
  const [issueReports, setIssueReports] = useState([]);

  const [newLibraryName, setNewLibraryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Custom Cybernetic Colors for Recharts
  const PIE_COLORS = ["#f43f5e", "#10b981", "#6366f1", "#f59e0b", "#06b6d4"];

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        meRes,
        libRes,
        ebookRes,
        studentsRes,
        sessionRes,
        statsRes,
        topReadRes,
        librarianRes,
        desktopsRes,
        issuesRes,
      ] = await Promise.all([
        api.get("/me"),
        api.get("/admin/libraries"),
        api.get("/api/ebooks"),
        api.get("/students/"),
        api.get("/sessions/active"),
        api.get("/api/analytics/stats"),
        api.get("/api/analytics/top-read-books?limit=5"),
        api.get("/admin/librarians"),
        api.get("/desktops/"),
        api.get("/issues"),
      ]);

      setUser(meRes.data || null);
      setLibraries(libRes.data || []);
      setEbooks(ebookRes.data || []);
      setStudents(studentsRes.data || []);
      setActiveSessions(sessionRes.data || []);
      setAnalyticsStats(statsRes.data || null);
      setTopReadBooks(topReadRes.data || []);
      setLibrarians(librarianRes.data || []);
      setDesktops(desktopsRes.data || []);
      setIssueReports(issuesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const booksByLibrary = useMemo(() => {
    const map = new Map();
    (ebooks || []).forEach((ebook) => {
      const libraryId = String(ebook.library || "");
      if (!libraryId) return;
      map.set(libraryId, (map.get(libraryId) || 0) + 1);
    });
    return map;
  }, [ebooks]);

  const libraryById = useMemo(() => {
    const map = new Map();
    (libraries || []).forEach((l) => map.set(String(l.id), l));
    return map;
  }, [libraries]);

  const studentsByLibrary = useMemo(() => {
    const map = new Map();
    (students || [])
      .filter((u) => u.role === "student")
      .forEach((u) => {
        const libraryId = String(u.library_id || "");
        if (!libraryId) return;
        map.set(libraryId, (map.get(libraryId) || 0) + 1);
      });
    return map;
  }, [students]);

  const studentById = useMemo(() => {
    const map = new Map();
    (students || []).forEach((u) => map.set(String(u.id), u));
    return map;
  }, [students]);
  
  const desktopCodeById = useMemo(() => {
    const map = new Map();
    (desktops || []).forEach((d) => map.set(String(d.id), d.desktop_id));
    return map;
  }, [desktops]);

  const lastNDays = useMemo(() => {
    const now = new Date();
    const days = 7;
    const out = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString([], { weekday: "short" }),
      });
    }
    return out;
  }, []);

  const newBooksByDay = useMemo(() => {
    const counts = new Map(lastNDays.map((d) => [d.key, 0]));
    (ebooks || []).forEach((e) => {
      const createdAt = e?.createdAt || e?.created_at;
      if (!createdAt) return;
      const day = new Date(createdAt).toISOString().slice(0, 10);
      if (counts.has(day)) counts.set(day, (counts.get(day) || 0) + 1);
    });
    return lastNDays.map((d) => ({ ...d, assets: counts.get(d.key) || 0 }));
  }, [ebooks, lastNDays]);

  const objectIdToDate = (id) => {
    if (!id || typeof id !== "string" || id.length < 8) return null;
    const tsHex = id.slice(0, 8);
    const seconds = Number.parseInt(tsHex, 16);
    if (!Number.isFinite(seconds)) return null;
    return new Date(seconds * 1000);
  };

  const newStudentsByDay = useMemo(() => {
    const counts = new Map(lastNDays.map((d) => [d.key, 0]));
    (students || [])
      .filter((u) => u.role === "student")
      .forEach((u) => {
        const d = objectIdToDate(String(u.id));
        if (!d) return;
        const day = d.toISOString().slice(0, 10);
        if (counts.has(day)) counts.set(day, (counts.get(day) || 0) + 1);
      });
    return lastNDays.map((d) => ({ ...d, members: counts.get(d.key) || 0 }));
  }, [students, lastNDays]);

  const activeStudentCount = useMemo(() => {
    const ids = new Set(
      (activeSessions || [])
        .map((s) => String(s.student_id || ""))
        .filter(Boolean),
    );
    return ids.size;
  }, [activeSessions]);

  const activeDesktopCount = useMemo(() => {
    const ids = new Set(
      (activeSessions || [])
        .map((s) => String(s.desktop_id || ""))
        .filter(Boolean),
    );
    return ids.size;
  }, [activeSessions]);
  
  // Data formatting for Recharts Donut (Library Assets)
  const libraryAssetDistribution = useMemo(() => {
    const data = [];
    libraries.forEach(lib => {
       const count = booksByLibrary.get(String(lib.id)) || 0;
       if (count > 0) {
          data.push({ name: lib.name, value: count });
       }
    });
    return data.length > 0 ? data : [{ name: "No Data", value: 1 }];
  }, [libraries, booksByLibrary]);

  const recentBooks = useMemo(() => {
    const rows = (ebooks || [])
      .map((e) => ({
        id: e._id || e.id,
        title: e.title,
        author: e.author,
        createdAt: e.createdAt,
        library: e.library,
      }))
      .filter((e) => e.id && e.title)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
    return rows;
  }, [ebooks]);

  const topReadRows = useMemo(() => {
    return (topReadBooks || []).map((r) => ({
      ebook_id: r.ebook_id,
      title: r.title || "(Unknown title)",
      author: r.author || "",
      library_id: r.library_id,
      readers: Number(r.readers || 0),
      totalMinutes: Number(r.totalMinutes || 0),
      avgProgress: typeof r.avgProgress === "number" ? r.avgProgress : null,
    }));
  }, [topReadBooks]);

  const handleAddLibrary = async (e) => {
    e.preventDefault();
    if (!newLibraryName.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await api.post("/admin/libraries", {
        name: newLibraryName.trim(),
      });
      setNewLibraryName("");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add library node.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLibrary = async (id) => {
    if (!window.confirm("Delete this library node?")) return;
    setError("");
    try {
      await api.delete(`/admin/libraries/${id}`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete library node.");
    }
  };

  const initials = (name) => {
    if (!name) return "?";
    const parts = String(name).trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
  };
  
  // Custom tooltip styling for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="astu-glass p-3 rounded-lg border border-rose-500/20 shadow-xl bg-[var(--bg-main)]/90 backdrop-blur-xl">
          <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
          {payload.map((entry, index) => (
             <p key={index} className="text-sm font-black astu-title" style={{ color: entry.color }}>
                {entry.name.toUpperCase()}: {entry.value}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <GeneralAdminLayout user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative w-12 h-12 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin" />
          </div>
        </div>
      </GeneralAdminLayout>
    );
  }

  return (
    <GeneralAdminLayout user={user}>
      <div className="space-y-10 pb-20">
        <header className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse-slow">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                Global Console
              </h1>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic mt-1">
                Root System Visualization Layer
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="astu-glass px-6 py-3 rounded-2xl border border-rose-500/10 bg-[var(--bg-main)] backdrop-blur-xl shadow-lg flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
                <div>
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Network Status</p>
                  <p className="text-sm font-black text-emerald-500 tracking-tighter uppercase italic">100% Operational</p>
                </div>
             </div>
          </div>
        </header>

        {error && (
          <div className="astu-glass rounded-2xl border border-rose-500/50 bg-rose-500/10 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-rose-500 italic shadow-lg flex gap-3 items-center">
            <span className="text-xl">⚠️</span> [Error Trace]: {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Governed Nodes", value: libraries.length, sub: "Registered Libraries", icon: BuildingLibraryIcon, color: "text-indigo-500" },
            { label: "Global Asset Wealth", value: ebooks.length.toLocaleString(), sub: "Total Books Indexed", icon: BookOpenIcon, color: "text-rose-500" },
            { label: "Live Researchers", value: activeStudentCount, sub: "Students Online Now", icon: UserGroupIcon, color: "text-emerald-500" },
            { label: "Active Deployments", value: activeDesktopCount, sub: "Desktops Running", icon: ServerStackIcon, color: "text-amber-500" },
          ].map((stat, idx) => (
            <div key={stat.label} className="astu-glass p-6 rounded-[2.5rem] border border-[var(--glass-border)] shadow-xl group relative overflow-hidden bg-gradient-to-b from-[var(--glass-bg)] to-[var(--bg-main)]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-700">
                 <stat.icon className={`h-24 w-24 ${stat.color}`} />
              </div>
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{stat.label}</p>
                <div className="flex flex-col gap-1">
                  <span className={`text-5xl font-black ${stat.color} tracking-tighter drop-shadow-md`}>{stat.value}</span>
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-80">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Growth Tracking Chart */}
          <div className="lg:col-span-2 astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] shadow-2xl bg-[var(--bg-main)]/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
             
             <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-3">
                 <ArrowTrendingUpIcon className="h-6 w-6 text-rose-500" />
                 <h2 className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tight">System Velocity Metrics</h2>
               </div>
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div><span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Assets Indexed</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div><span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">New Members</span></div>
               </div>
             </div>

             <div className="h-72 w-full mt-4 relative z-10 text-[10px] font-black uppercase font-mono text-[var(--text-muted)]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={newBooksByDay.map((b, i) => ({ label: b.label, assets: b.assets, members: newStudentsByDay[i]?.members || 0 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" tickSize={0} dy={10} />
                     <YAxis stroke="rgba(255,255,255,0.1)" tickSize={0} dx={-10} />
                     <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                     <Area type="monotone" dataKey="assets" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorAssets)" animationDuration={1500} />
                     <Area type="monotone" dataKey="members" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" animationDuration={1500} />
                   </AreaChart>
                 </ResponsiveContainer>
             </div>
          </div>

          {/* Asset Distribution Donut */}
          <div className="astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] shadow-2xl relative bg-[var(--bg-main)]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 relative z-10">
               <div className="flex items-center gap-3">
                 <ChartBarIcon className="h-6 w-6 text-indigo-500" />
                 <h2 className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tight">Asset Spread</h2>
               </div>
            </div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic mb-6">Library Index Distribution</p>

            <div className="h-full w-full relative min-h-[220px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={libraryAssetDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     animationDuration={1500}
                     stroke="none"
                   >
                     {libraryAssetDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: `drop-shadow(0px 0px 8px ${PIE_COLORS[index % PIE_COLORS.length]}90)`}} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} />
                 </PieChart>
               </ResponsiveContainer>
               
               {/* Center Label inside Donut */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-[var(--text-main)] astu-title">{ebooks.length}</span>
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-tight">Total Books</span>
               </div>
            </div>
          </div>
        </section>
        
        {/* Signal Interference (Issues) */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-4">
              <div className="h-1 w-12 bg-rose-500 rounded-full" />
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic">Global Signal Interference Log</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {issueReports.length > 0 ? (
                issueReports.slice(0, 6).map(report => (
                  <div key={report.id || report._id} className="astu-glass p-6 rounded-[2rem] border border-rose-500/20 bg-[var(--bg-main)]/40 relative overflow-hidden group hover:border-rose-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {report.category || "General Alert"}
                       </span>
                       <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-50">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                       <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 font-black text-[10px]">
                          #{desktopCodeById.get(String(report.desktop_id)) || "???"}
                       </div>
                       <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">
                          {libraryById.get(String(report.library_id))?.name || "Global Node"}
                       </h4>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] italic leading-relaxed mb-6 line-clamp-2">
                       {report.description}
                    </p>
                    <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                          BY: {studentById.get(String(report.student_id))?.student_id || "UNIDENTIFIED"}
                       </span>
                       <button className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Acknowledge</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full astu-glass py-20 rounded-[3rem] border border-[var(--glass-border)] flex flex-col items-center justify-center opacity-40 text-center italic space-y-4">
                   <SignalIcon className="h-12 w-12 text-slate-400" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No signal interference detected across the network.</p>
                </div>
              )}
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Command and Control Panel */}
          <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden relative bg-[var(--glass-bg)]/20 flex flex-col">
             <div className="px-10 py-8 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Command & Control</h3>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1 italic">Administrative Override Hub</p>
                </div>
                <BoltIcon className="h-8 w-8 text-rose-500 opacity-20 animate-pulse" />
             </div>
             
             <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center">
                <button className="flex flex-col items-start p-6 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--glass-border)] hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group text-left">
                   <SignalIcon className="h-6 w-6 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                   <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Global Asset Sync</span>
                   <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1 italic opacity-70">Force index update</span>
                </button>
                <button className="flex flex-col items-start p-6 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--glass-border)] hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group text-left">
                   <ServerStackIcon className="h-6 w-6 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                   <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Desktop Purge</span>
                   <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1 italic opacity-70">Reclaim idle memory</span>
                </button>
                <button className="flex flex-col items-start p-6 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--glass-border)] hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group text-left">
                   <UserGroupIcon className="h-6 w-6 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                   <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Halt Registration</span>
                   <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1 italic opacity-70">Lock new student accounts</span>
                </button>
                <button className="flex flex-col items-start p-6 rounded-2xl bg-[var(--bg-main)]/50 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500 hover:text-white transition-all group text-left">
                   <ShieldCheckIcon className="h-6 w-6 text-rose-500 group-hover:text-white mb-4 group-hover:scale-110 transition-transform" />
                   <span className="text-[11px] font-black text-rose-500 group-hover:text-white uppercase tracking-widest">E-Stop System</span>
                   <span className="text-[9px] text-rose-400 group-hover:text-rose-200 uppercase tracking-widest mt-1 italic opacity-70">Emergency shutdown</span>
                </button>
             </div>
          </div>

          <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden relative bg-[var(--glass-bg)]/20">
             <div className="px-10 py-8 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Academic Influence</h3>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1 italic">Highest Circulation Titles</p>
                </div>
             </div>
             <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                   <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em] shadow-sm rounded-lg">
                      <tr>
                         <th className="px-6 py-4 text-left rounded-l-xl">Asset Identity</th>
                         <th className="px-6 py-4 text-right">Read Count</th>
                         <th className="px-6 py-4 text-right rounded-r-xl">Time (Min)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--glass-border)]/50">
                      {topReadRows.map((r, idx) => (
                         <tr key={idx} className="group hover:bg-rose-500/5 transition-all">
                            <td className="px-6 py-5">
                               <div className="font-black text-[var(--text-main)] uppercase tracking-tight text-xs group-hover:text-rose-600 transition-colors line-clamp-1">{r.title}</div>
                               <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 italic">
                                  {r.author || "Faculty Archive"}
                               </div>
                            </td>
                            <td className="px-6 py-5 text-right font-black text-indigo-500 text-sm">{r.readers}</td>
                            <td className="px-6 py-5 text-right font-mono text-[var(--text-muted)] text-[9px] uppercase tracking-widest">{r.totalMinutes.toLocaleString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </section>

        {/* Global Node Network Registry */}
        <section className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl relative overflow-hidden bg-gradient-to-r from-[var(--bg-main)] to-[var(--glass-bg)]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] filter blur-sm">
             <BuildingLibraryIcon className="h-64 w-64" />
          </div>
          <div className="px-10 py-10 border-b border-[var(--glass-border)] flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Node Network Registry</h2>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic mt-1">Institutional Deployment Control</p>
            </div>
            
            <form onSubmit={handleAddLibrary} className="flex-1 max-w-lg w-full flex items-center gap-4">
              <input
                type="text"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                placeholder="Initialize Node ID..."
                className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={submitting}
                className="astu-btn-premium px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-500/20 flex items-center gap-2 flex-shrink-0"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{submitting ? "Establish…" : "Establish Node"}</span>
              </button>
            </form>
          </div>

          <div className="divide-y divide-[var(--glass-border)] relative z-10">
            {libraries.map((lib) => {
              const booksCount = booksByLibrary.get(String(lib.id)) || 0;
              const studentsCount = studentsByLibrary.get(String(lib.id)) || 0;
              return (
                <div key={lib.id} className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-rose-500/5 transition-all">
                  <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="h-20 w-20 rounded-[2rem] bg-rose-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-rose-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 relative shrink-0">
                       {initials(lib.name)}
                       <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[var(--bg-main)] border-4 border-[var(--bg-main)] flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                       </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter group-hover:text-rose-500 transition-colors">{lib.name}</h4>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 mb-4 italic">Node Architecture: Virtual Deployment</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="astu-glass px-4 py-2 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex items-center gap-3 shadow-inner">
                           <BookOpenIcon className="h-4 w-4 text-indigo-500" />
                           <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{booksCount} Global Assets</span>
                        </div>
                        <div className="astu-glass px-4 py-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex items-center gap-3 shadow-inner">
                           <UserGroupIcon className="h-4 w-4 text-emerald-500" />
                           <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{studentsCount} Researchers</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => navigate(`/general-admin-library-nodes`)}
                      className="astu-glass px-6 py-3 rounded-xl border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
                    >
                      Terminal Access
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLibrary(lib.id)}
                      className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md"
                      title="Decommission Node"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </GeneralAdminLayout>
  );
}
