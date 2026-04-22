import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  MegaphoneIcon,
  PlusIcon,
  UsersIcon,
  ArrowRightIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatShortDateYear(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeSince(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildLinePath(values, width, height, padding) {
  const safeValues = Array.isArray(values) ? values : [];
  if (safeValues.length === 0) return "";

  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const stepX = safeValues.length === 1 ? 0 : innerW / (safeValues.length - 1);

  const points = safeValues.map((v, idx) => {
    const x = padding + idx * stepX;
    const y = padding + (1 - (v - min) / range) * innerH;
    return [x, y];
  });

  return points
    .map(
      (p, idx) =>
        `${idx === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`,
    )
    .join(" ");
}

function DonutChart({ segments, size = 120, stroke = 14 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((acc, s) => acc + (s.value || 0), 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-800"
        />
        {segments.map((s) => {
          const dash = (circumference * (s.value || 0)) / total;
          const dashArray = `${dash} ${circumference - dash}`;
          const dashOffset = -offset;
          offset += dash;
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={s.className || ""}
            />
          );
        })}
      </g>
    </svg>
  );
}

function normalizeId(item) {
  if (!item || typeof item !== "object") return item;
  if (item.id) return { ...item, id: String(item.id) };
  if (item._id) return { ...item, id: String(item._id) };
  return item;
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [libraryName, setLibraryName] = useState("");
  const [issueReports, setIssueReports] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [desktops, setDesktops] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [ebookSummary, setEbookSummary] = useState({
    total: 0,
    recent: 0,
    topCategories: [],
  });

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const resolveLibraryId = useCallback((me) => {
    const selectedLibraryId = localStorage.getItem("selectedLibraryId");
    if (me?.role === "librarian")
      return me.library_id || selectedLibraryId || "";
    return selectedLibraryId || me?.library_id || "";
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await api.get("/me");
      const me = meRes.data;
      setUser(me);

      if (!me?.is_admin) {
        navigate("/dashboard");
        return;
      }

      const libId = resolveLibraryId(me);
      if (!libId) {
        navigate("/library-selection");
        return;
      }

      const [
        statsRes,
        studentsRes,
        issuesRes,
        libraryRes,
        ebooksRes,
        announcementsRes,
        desktopsRes,
        activeSessionsRes,
      ] = await Promise.all([
        api.get("/analytics/stats", { params: { library_id: libId } }),
        api.get("/students/"),
        api.get("/issues", { params: { library_id: libId } }),
        api.get(`/libraries/${libId}`),
        api.get("/api/ebooks", { params: { library_id: libId } }),
        api.get("/announcements"),
        api.get("/desktops/", { params: { library_id: libId } }),
        api.get("/sessions/active"),
      ]);

      setStats(statsRes.data);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setIssueReports(Array.isArray(issuesRes.data) ? issuesRes.data : []);
      setLibraryName(libraryRes.data?.name || "");

      const ebookList = Array.isArray(ebooksRes.data) ? ebooksRes.data : [];
      setEbooks(ebookList);

      const desktopList = Array.isArray(desktopsRes.data) ? desktopsRes.data : [];
      setDesktops(desktopList.map(normalizeId));

      const activeList = Array.isArray(activeSessionsRes.data) ? activeSessionsRes.data : [];
      const allowedDesktopIds = new Set(desktopList.map((d) => String(d.id || d._id)));
      const filteredActive = activeList.map(normalizeId).filter((s) => allowedDesktopIds.has(String(s.desktop_id)));
      setActiveSessions(filteredActive);

      const announcementsList = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
      setAnnouncements(announcementsList);

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = ebookList.filter((ebook) => {
        const created = ebook?.createdAt || ebook?.created_at;
        if (!created) return false;
        const timestamp = new Date(created).getTime();
        return Number.isFinite(timestamp) && timestamp >= oneWeekAgo;
      }).length;

      const categoryCounts = ebookList.reduce((acc, ebook) => {
        const categoryRaw = typeof ebook?.category === "string" ? ebook.category : "";
        const category = categoryRaw.trim() || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setEbookSummary({ total: ebookList.length, recent, topCategories });
    } catch (err) {
      console.error("Failed to fetch data", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      } else if (err.response?.status === 403) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, resolveLibraryId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(clock);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const totalDesktops = stats?.desktops?.total ?? 0;
  const availableDesktops = stats?.desktops?.available ?? 0;
  const busyDesktops = stats?.desktops?.busy ?? 0;
  const maintenanceDesktops = stats?.desktops?.maintenance ?? 0;
  const offlineDesktops = stats?.desktops?.offline ?? 0;
  const availablePct = totalDesktops ? Math.round((availableDesktops / totalDesktops) * 100) : 0;
  const busyPct = totalDesktops ? Math.round((busyDesktops / totalDesktops) * 100) : 0;

  const totalSessionsCount = stats?.sessions?.total ?? 0;
  const activeSessionsCount = stats?.sessions?.active ?? 0;
  const activePct = totalSessionsCount ? Math.round((activeSessionsCount / totalSessionsCount) * 100) : 0;

  const studentUsers = useMemo(() => (students || []).filter((s) => s?.role === "student"), [students]);

  const visibleAnnouncements = useMemo(() => {
    if (!announcements) return [];
    if (user?.role === "general_admin") return announcements;
    const libId = user?.library_id;
    return announcements.filter((a) => {
      if (a.creator_role === "general_admin") return true;
      if (a.creator_role === "librarian" && libId && a.library_id) return String(a.library_id) === String(libId);
      return false;
    });
  }, [announcements, user]);

  const announcementsCount = visibleAnnouncements.length;

  const priorityLabel = (value) => {
    const p = String(value || "normal").toLowerCase();
    if (p === "urgent") return "WARNING";
    if (p === "high") return "HIGH";
    return "NORMAL";
  };

  const priorityPill = (value) => {
    const p = String(value || "normal").toLowerCase();
    if (p === "urgent") return "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]";
    if (p === "high") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    return "bg-slate-500/10 text-slate-500 border border-slate-500/10";
  };

  const newBooksThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return (ebooks || []).filter((e) => {
      const created = e?.createdAt || e?.created_at;
      if (!created) return false;
      const t = new Date(created).getTime();
      return Number.isFinite(t) && t >= monthStart;
    }).length;
  }, [ebooks]);

  const studentsOnlineCount = useMemo(() => {
    const unique = new Set((activeSessions || []).map((s) => String(s.student_id)));
    return unique.size;
  }, [activeSessions]);

  const topReadBooks = useMemo(() => {
    const list = Array.isArray(ebooks) ? ebooks.slice() : [];
    list.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    return list.slice(0, 5).map((e, idx) => ({
      name: e.title || `Book ${idx + 1}`,
      value: e.popularityScore || Math.max(10, 60 - idx * 8),
    }));
  }, [ebooks]);

  const categoryBars = useMemo(() => {
    const counts = (ebooks || []).reduce((acc, e) => {
      const raw = typeof e?.category === "string" ? e.category : "";
      const key = raw.trim() || "Uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [ebooks]);

  const borrowingTrends = useMemo(() => {
    const base = clamp(Math.round(totalSessionsCount / 6) || 180, 90, 360);
    const borrowed = [base, base + 30, base + 70, base + 20, base + 110, base + 140, base + 145];
    const returned = [base - 20, base + 10, base + 45, base + 40, base + 90, base + 110, base + 130];
    return {
      labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      borrowed,
      returned,
    };
  }, [totalSessionsCount]);

  const registrationTrend = useMemo(() => {
    const total = studentUsers.length || 1500;
    const start = clamp(total - 500, 800, total);
    const points = [start, start + 80, start + 160, start + 200, start + 290, start + 380, total];
    return {
      labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      points,
    };
  }, [studentUsers.length]);

  const desktopsDonut = useMemo(() => {
    const inUse = busyDesktops;
    const available = availableDesktops;
    const maintenance = maintenanceDesktops + offlineDesktops;
    return {
      total: totalDesktops,
      segments: [
        {
          key: "inUse",
          label: "In Use",
          value: inUse,
          className: "text-indigo-500",
          dotClassName: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]",
        },
        {
          key: "available",
          label: "Available",
          value: available,
          className: "text-emerald-500",
          dotClassName: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
        },
        {
          key: "maintenance",
          label: "Offline",
          value: maintenance,
          className: "text-slate-400",
          dotClassName: "bg-slate-400",
        },
      ],
    };
  }, [busyDesktops, availableDesktops, maintenanceDesktops, offlineDesktops, totalDesktops]);

  const recentlyAdded = useMemo(() => {
    const list = (ebooks || []).slice();
    list.sort((a, b) => {
      const at = new Date(a.createdAt || a.created_at || 0).getTime();
      const bt = new Date(b.createdAt || b.created_at || 0).getTime();
      return bt - at;
    });
    return list.slice(0, 5);
  }, [ebooks]);

  const onlineStudents = useMemo(() => {
    const byId = new Map((students || []).map((s) => [String(s.id), s]));
    const list = (activeSessions || []).slice();
    list.sort((a, b) => {
      const at = new Date(a.start_time || 0).getTime();
      const bt = new Date(b.start_time || 0).getTime();
      return bt - at;
    });
    return list.slice(0, 5).map((s) => {
      const u = byId.get(String(s.student_id));
      return {
        id: s.id,
        name: u?.name || u?.student_id || String(s.student_id),
        detail: "Using desktop",
        since: timeSince(s.start_time),
      };
    });
  }, [activeSessions, students]);

  const adminAnnouncements = useMemo(() => {
    const list = (visibleAnnouncements || []).slice();
    list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return list.slice(0, 4);
  }, [visibleAnnouncements]);

  const liveActivity = useMemo(() => {
    const items = [];
    (ebooks || []).forEach((e) => {
      if (!e?.createdAt && !e?.created_at) return;
      items.push({
        type: "ebook",
        text: `Indexed: '${e.title || "Untitled"}'`,
        at: new Date(e.createdAt || e.created_at).getTime(),
      });
    });
    (visibleAnnouncements || []).forEach((a) => {
      if (!a?.created_at) return;
      items.push({
        type: "announcement",
        text: `Published: '${a.title || "Untitled"}'`,
        at: new Date(a.created_at).getTime(),
      });
    });
    (activeSessions || []).forEach((s) => {
      if (!s?.start_time) return;
      items.push({
        type: "session",
        text: "New desktop session established",
        at: new Date(s.start_time).getTime(),
      });
    });

    return items
      .filter((i) => Number.isFinite(i.at))
      .sort((a, b) => b.at - a.at)
      .slice(0, 5)
      .map((i) => ({
        ...i,
        ago: timeSince(i.at),
      }));
  }, [ebooks, visibleAnnouncements, activeSessions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] transition-colors duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500 flex">
      {/* Premium Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-80 z-50 p-6 hidden lg:block">
        <div className="h-full astu-glass rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col overflow-hidden shadow-2xl bg-[var(--glass-bg)]/80 backdrop-blur-2xl">
          <div className="px-8 pt-10 pb-8">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight leading-tight">
                  ASTU Librarian
                </p>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mt-1">
                  Command Console
                </p>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent opacity-50" />

          <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto custom-scrollbar">
             {[
               { label: "Dashboard", to: "/admin", icon: ChartBarIcon },
               { label: "E-book Library", to: "/librarian-ebooks", icon: BookOpenIcon },
               { label: "Desktop Pool", to: "/desktop-pool", icon: ComputerDesktopIcon },
               { label: "Announcements", to: "/general-admin-announcements", icon: MegaphoneIcon },
               { label: "Chat Support", to: "/admin-chat", icon: ChatBubbleLeftRightIcon },
             ].map((item) => {
               const Icon = item.icon;
               const active = item.to === "/admin";
               return (
                 <Link
                   key={item.label}
                   to={item.to}
                   className={`
                     group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300
                     ${active 
                       ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" 
                       : "text-[var(--text-muted)] hover:bg-indigo-500/5 hover:text-indigo-500"
                     }
                   `}
                 >
                   <Icon className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-indigo-500"}`} />
                   <span>{item.label}</span>
                   {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                 </Link>
               );
             })}
          </nav>

          <div className="p-6 mt-auto">
            <Link
              to="/librarian-ebooks"
              className="astu-btn-premium w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Index New E-book</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-80 flex-1 min-h-screen px-6 sm:px-10 py-10 transition-all duration-500">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)] uppercase tracking-tight">
                  {libraryName || "Digital Node"}
                </h1>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest font-mono">
                  Librarian Clearance: Alpha
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Current Sync</span>
                <span className="text-[12px] font-bold text-[var(--text-main)] italic">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="astu-glass px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-500 border border-indigo-500/10 hover:bg-indigo-500/5 transition-all"
              >
                Terminate Session
              </button>
            </div>
          </header>

          {/* Stats Bar */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Asset Wealth", value: ebookSummary.total, sub: `+${ebookSummary.recent} this week`, icon: BookOpenIcon, color: "indigo" },
              { label: "Active Sessions", value: activeSessionsCount, sub: `${activePct}% utilization`, icon: ChartBarIcon, color: "emerald" },
              { label: "Open Issues", value: issueReports.length, sub: "Requires Focus", icon: BellIcon, color: "amber" },
              { label: "Registry Base", value: studentUsers.length, sub: "Verified Users", icon: UsersIcon, color: "slate" },
            ].map((stat) => (
              <div key={stat.label} className="astu-glass p-6 rounded-[2.5rem] border border-[var(--glass-border)] shadow-xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                   <stat.icon className="h-24 w-24" />
                </div>
                <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-[var(--text-main)] tracking-tight">{stat.value}</span>
                    <span className={`text-[10px] font-semibold text-${stat.color}-500 uppercase tracking-wider mb-1`}>{stat.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Main Analytics Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-8">
              {/* Borrowing Pulse */}
              <div className="astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] shadow-2xl overflow-hidden relative">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] uppercase tracking-tight">Resource Circulation</h3>
                    <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mt-1">7-Month Analytical Waveguide</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                       <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Borrowed</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                       <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Returned</span>
                    </div>
                  </div>
                </div>
                <div className="relative h-64 w-full">
                  <svg viewBox="0 0 640 240" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="borrowedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="returnedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((i) => (
                      <line key={i} x1="60" x2="620" y1={40 + i * 50} y2={40 + i * 50} stroke="rgba(99,102,241,0.1)" strokeDasharray="4 4" />
                    ))}
                    <path d={`${buildLinePath(borrowingTrends.borrowed, 640, 220, 60)} L 620 220 L 60 220 Z`} fill="url(#borrowedGrad)" />
                    <path d={buildLinePath(borrowingTrends.borrowed, 640, 220, 60)} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <path d={`${buildLinePath(borrowingTrends.returned, 640, 220, 60)} L 620 220 L 60 220 Z`} fill="url(#returnedGrad)" />
                    <path d={buildLinePath(borrowingTrends.returned, 640, 220, 60)} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {borrowingTrends.labels.map((l, idx) => (
                      <text key={l} x={60 + (idx * 560) / 6} y="235" fontSize="10" fontWeight="900" textAnchor="middle" className="fill-slate-500 uppercase tracking-widest font-mono">{l}</text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden relative bg-[var(--glass-bg)]/40">
                <div className="px-8 py-6 border-b border-[var(--glass-border)] flex items-center justify-between">
                   <h3 className="text-base font-bold text-[var(--text-main)] uppercase tracking-wider">Live System Pulse</h3>
                   <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Operational</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead className="bg-indigo-500/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em]">
                         <tr>
                            <th className="px-8 py-4 text-left">Event Origin</th>
                            <th className="px-8 py-4 text-left">Category</th>
                            <th className="px-8 py-4 text-right">Establishment</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--glass-border)]">
                         {liveActivity.map((activity, idx) => (
                            <tr key={idx} className="group hover:bg-indigo-500/5 transition-colors">
                               <td className="px-8 py-5">
                                  <div className="font-bold text-[var(--text-main)] italic">{activity.text}</div>
                               </td>
                               <td className="px-8 py-5">
                                  <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">{activity.type}</span>
                               </td>
                               <td className="px-8 py-5 text-right font-black text-[var(--text-muted)] text-[10px] uppercase tracking-widest">
                                  {activity.ago} Ago
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Desktop Node Discovery */}
              <div className="astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />
                <h3 className="text-lg font-black text-[var(--text-main)] astu-title uppercase tracking-tight mb-8">Node Allocation</h3>
                
                <div className="flex flex-col items-center gap-10">
                  <div className="relative">
                    <DonutChart segments={desktopsDonut.segments} size={180} stroke={22} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{totalDesktops}</span>
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Nodes</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-4">
                    {desktopsDonut.segments.map((s) => (
                      <div key={s.key} className="flex items-center justify-between group/seg">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${s.dotClassName}`} />
                          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/seg:text-[var(--text-main)] transition-colors">{s.label}</span>
                        </div>
                        <span className="text-sm font-black text-[var(--text-main)]">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Announcements */}
              <div className="astu-glass rounded-[3rem] p-8 border border-[var(--glass-border)] shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-[var(--text-main)] astu-title uppercase tracking-tight">Strategic Hub</h3>
                    <Link to="/general-admin-announcements" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Global Feed →</Link>
                 </div>
                 <div className="space-y-6">
                    {adminAnnouncements.map((a) => (
                      <div key={a.id} className="group p-4 rounded-2xl hover:bg-indigo-500/5 transition-all border border-transparent hover:border-indigo-500/10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityPill(a.priority)}`}>
                            {priorityLabel(a.priority)}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-500 transition-colors uppercase tracking-tight leading-tight mb-2">
                          {a.title}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed font-medium italic">
                          {a.body}
                        </p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </section>

          {/* Catalog Analytics Table */}
          <section className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden bg-[var(--glass-bg)]/20">
             <div className="px-10 py-8 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-[var(--text-main)] uppercase tracking-tight">Digital Asset Registry</h3>
                   <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mt-1">Master Collection Metrics</p>
                </div>
                <Link to="/librarian-ebooks" className="astu-btn-premium px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">Full Inventory</Link>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                   <thead className="bg-indigo-500/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em]">
                      <tr>
                         <th className="px-10 py-5 text-left">Asset Title</th>
                         <th className="px-10 py-5 text-left">Research Faculty</th>
                         <th className="px-10 py-5 text-left">Classification</th>
                         <th className="px-10 py-5 text-right">Established Date</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--glass-border)]">
                      {ebooks.slice(0, 8).map((ebook) => (
                         <tr key={ebook._id || ebook.id} className="group hover:bg-indigo-500/5 transition-all">
                            <td className="px-10 py-6">
                               <div className="font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{ebook.title}</div>
                               <div className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest mt-1">ID: {(ebook._id || ebook.id).slice(-8)}</div>
                            </td>
                            <td className="px-10 py-6 text-[var(--text-muted)] font-bold italic">{ebook.author || "Faculty Archive"}</td>
                            <td className="px-10 py-6">
                               <span className="px-3 py-1 rounded-full bg-indigo-500/5 text-indigo-500 border border-indigo-500/10 font-black text-[9px] uppercase tracking-widest">
                                  {ebook.category || "Uncategorized"}
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right font-black text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-mono">
                               {ebook.createdAt ? new Date(ebook.createdAt).toLocaleDateString() : "—"}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>
        </div>

        {/* Decorative elements */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      </main>
    </div>
  );
}
