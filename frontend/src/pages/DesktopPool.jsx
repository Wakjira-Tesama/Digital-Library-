import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import GeneralAdminLayout from "../components/GeneralAdminLayout";
import {
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  MegaphoneIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const TIME_SLOTS = [
  { start: "08:00", end: "09:00", label: "8:00AM-9:00AM" },
  { start: "09:00", end: "10:00", label: "9:00AM-10:00AM" },
  { start: "10:00", end: "11:00", label: "10:00AM-11:00AM" },
  { start: "11:00", end: "12:00", label: "11:00AM-12:00PM" },
  { start: "12:00", end: "13:00", label: "12:00PM-1:00PM" },
  { start: "13:00", end: "14:00", label: "1:00PM-2:00PM" },
  { start: "14:00", end: "15:00", label: "2:00PM-3:00PM" },
  { start: "15:00", end: "16:00", label: "3:00PM-4:00PM" },
  { start: "16:00", end: "17:00", label: "4:00PM-5:00PM" },
  { start: "17:00", end: "18:00", label: "5:00PM-6:00PM" },
];

function normalizeId(entity) {
  if (!entity) return entity;
  const id = entity._id || entity.id;
  return { ...entity, id };
}

export default function DesktopPool() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [desktops, setDesktops] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [students, setStudents] = useState([]);
  const [libraryName, setLibraryName] = useState("");
  const [issueReports, setIssueReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingDesktopId, setUpdatingDesktopId] = useState(null);
  const [endingSessionId, setEndingSessionId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteDesktop, setPendingDeleteDesktop] = useState(null);
  const [newDesktop, setNewDesktop] = useState({
    desktop_id: "",
    ip_address: "",
    status: "available",
  });
  const [activeTab, setActiveTab] = useState("issues"); // "issues" or "fleet"

  const navigate = useNavigate();

  const resolveLibraryId = useCallback((me) => {
    const stored = localStorage.getItem("selectedLibraryId");
    return stored || me?.library_id || me?.library?.id || me?.library?._id || null;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const meRes = await api.get("/me");
      const me = meRes.data;
      setUser(me);

      const libId = resolveLibraryId(me);
      if (!libId) {
        navigate("/library-selection");
        return;
      }

      const [desktopsRes, sessionsRes, studentsRes, scheduleRes, issuesRes, libraryRes] = await Promise.all([
        api.get("/desktops/", { params: { library_id: libId } }),
        api.get("/sessions/active"),
        api.get("/students/"),
        api.get("/schedule", { params: { day: today, library_id: libId } }),
        api.get("/issues", { params: { library_id: libId } }),
        api.get(`/libraries/${libId}`),
      ]);

      const desktopList = Array.isArray(desktopsRes.data) ? desktopsRes.data : desktopsRes.data?.desktops || [];
      const normalizedDesktops = desktopList.map(normalizeId);
      setDesktops(normalizedDesktops);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setScheduleEntries(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
      setIssueReports(Array.isArray(issuesRes.data) ? issuesRes.data : []);
      setLibraryName(libraryRes.data?.name || "");
      setActiveSessions((sessionsRes.data || []).map(normalizeId));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [navigate, resolveLibraryId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getNextIp = useCallback(() => {
    const base = "192.168.1.";
    const lastOctets = desktops.map(d => d.ip_address || "").filter(ip => ip.startsWith(base)).map(ip => Number(ip.replace(base, ""))).filter(v => Number.isInteger(v) && v > 0);
    const maxOctet = lastOctets.length ? Math.max(...lastOctets) : 99;
    return `${base}${maxOctet + 1}`;
  }, [desktops]);

  const handleAddDesktop = async (e) => {
    e.preventDefault();
    if (!newDesktop.desktop_id) {
       alert("Node ID is required.");
       return;
    }
    try {
      await api.post("/desktops/", { 
         ...newDesktop, 
         ip_address: newDesktop.ip_address || getNextIp() 
      });
      setShowAddModal(false);
      setNewDesktop({ desktop_id: "", ip_address: "", status: "available" });
      fetchData();
    } catch (err) { 
       console.error(err); 
       alert(err.response?.data?.detail || "Failed to add desktop. Check if the Node ID is unique.");
    }
  };

  const handleDeleteDesktop = async (id) => {
    try {
      await api.delete(`/desktops/${id}`);
      setShowDeleteModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id, status) => {
    setUpdatingDesktopId(id);
    try {
      await api.patch(`/desktops/${id}/status`, { status });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setUpdatingDesktopId(null); }
  };

  const handleEndSession = async (id) => {
    setEndingSessionId(id);
    try {
      await api.post(`/sessions/${id}/end`);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setEndingSessionId(null); }
  };

  const handleDeleteIssue = async (id) => {
    try {
      await api.delete(`/issues/${id}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const studentById = useMemo(() => (students || []).reduce((acc, s) => ({ ...acc, [String(s.id)]: s.student_id }), {}), [students]);
  const desktopCodeById = useMemo(() => (desktops || []).reduce((acc, d) => ({ ...acc, [String(d.id)]: d.desktop_id }), {}), [desktops]);
  const activeByDesktop = useMemo(() => (activeSessions || []).reduce((acc, s) => ({ ...acc, [String(s.desktop_id)]: s }), {}), [activeSessions]);

  const stats = useMemo(() => ({
    total: desktops.length,
    available: desktops.filter(d => d.status === 'available').length,
    busy: desktops.filter(d => d.status === 'busy').length,
    offline: desktops.filter(d => d.status === 'offline' || d.status === 'maintenance').length,
  }), [desktops]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Syncing Fleet Data...</p>
      </div>
    );
  }

  const pageContent = (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ComputerDesktopIcon className="h-8 w-8 text-indigo-500 relative z-10" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                 Fleet Registry
              </h1>
              <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest font-mono mt-1 leading-none">
                 Node Control Center & Connectivity Log
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 max-w-full">
           {[
             { label: "Active Nodes", val: stats.total, color: "indigo" },
             { label: "Ready", val: stats.available, color: "emerald" },
             { label: "Linked", val: stats.busy, color: "sky" },
             { label: "Critical", val: stats.offline, color: "rose" },
           ].map(stat => (
             <div key={stat.label} className="astu-glass px-6 py-3 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 shadow-lg group hover:border-indigo-500/30 transition-colors">
                <div className={`h-2 w-2 rounded-full bg-${stat.color}-500 shadow-[0_0_8px_${stat.color}] animate-pulse`} />
                <div className="text-right">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 leading-none mb-1">{stat.label}</p>
                   <p className="text-xl font-black text-[var(--text-main)] leading-none italic">{stat.val}</p>
                </div>
             </div>
           ))}
        </div>
      </header>

      {/* Main Grid: Status Sheet & Issue Log */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
         {/* Live Connectivity Matrix */}
         <section className="space-y-6 min-w-0">
            <div className="flex items-center gap-3 px-4">
               <div className="h-1 w-12 bg-indigo-500 rounded-full" />
               <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic">Live Connectivity Matrix</h3>
            </div>
            
            <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl bg-[var(--glass-bg)]/20 overflow-hidden">
               <div className="overflow-auto custom-scrollbar max-h-[72vh] scroll-smooth">
                  <table className="w-full border-separate border-spacing-0">
                     <thead className="sticky top-0 z-[60]">
                        <tr className="bg-[var(--bg-main)]/95 backdrop-blur-3xl">
                           <th className="px-12 py-10 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] sticky left-0 top-0 z-[70] bg-[var(--bg-main)] backdrop-blur-3xl border-b border-r border-[var(--glass-border)] shadow-xl min-w-[200px]">
                              Temporal Window
                           </th>
                           {desktops.map(d => (
                             <th key={d.id} className="px-4 py-8 text-center relative border-b border-r border-[var(--glass-border)]/20 last:border-r-0 min-w-[150px]">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 italic mb-4">Sector {d.desktop_id}</div>
                                <div className="flex items-center justify-center gap-2">
                                   <button 
                                     onClick={() => { setPendingDeleteDesktop(d); setShowDeleteModal(true); }}
                                     className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-500/20"
                                     title="Purge Node"
                                   >
                                      <TrashIcon className="h-4 w-4" />
                                   </button>
                                </div>
                             </th>
                           ))}
                           <th className="px-6 py-6 text-center border-b border-[var(--glass-border)]/20">
                              <button 
                                onClick={() => setShowAddModal(true)}
                                className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-xl hover:shadow-indigo-500/20 group/add"
                                title="Initialize New Node"
                              >
                                 <PlusIcon className="h-5 w-5 group-hover/add:rotate-90 transition-transform" />
                              </button>
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--glass-border)]">
                        {TIME_SLOTS.map(slot => (
                          <tr key={slot.start} className="group hover:bg-indigo-500/[0.03] transition-colors duration-500">
                             <td className="px-8 py-5 sticky left-0 z-50 bg-[var(--bg-main)]/95 backdrop-blur-3xl border-r border-[var(--glass-border)] transition-colors group-hover:bg-indigo-500/[0.05]">
                                <div className="flex items-center gap-3">
                                   <ClockIcon className="h-4 w-4 text-slate-400" />
                                   <span className="text-[11px] font-bold text-[var(--text-main)] italic">{slot.label}</span>
                                </div>
                             </td>
                             {desktops.map(d => {
                               const entry = scheduleEntries.find(e => String(e.desktop_id) === String(d.id) && e.start_time === slot.start);
                               const session = activeByDesktop[String(d.id)];
                               
                               let statusVal = "Ready";
                               let color = "emerald";
                               
                               if (entry) {
                                  statusVal = entry.student_id || "Reserved";
                                  color = "indigo";
                                } else if (d.status === 'busy' && session) {
                                  statusVal = studentById[String(session.student_id)] || "Linked";
                                  color = "sky";
                                } else if (d.status !== 'available') {
                                  statusVal = d.status.toUpperCase();
                                  color = "rose";
                                }

                               return (
                                 <td key={`${d.id}-${slot.start}`} className="px-4 py-4 text-center">
                                    <div className={clsx(
                                      "mx-auto w-32 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-all duration-500 border border-transparent shadow-sm",
                                      color === 'emerald' && "bg-emerald-500/5 text-emerald-500 group-hover:bg-emerald-500/10",
                                      color === 'indigo' && "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105",
                                      color === 'sky' && "bg-sky-500/10 text-sky-500 animate-pulse border-sky-500/20",
                                      color === 'rose' && "bg-rose-500/5 text-rose-500 border-rose-500/10"
                                    )}>
                                       {statusVal}
                                    </div>
                                 </td>
                               );
                             })}
                             <td className="px-6 py-6 border-l border-[var(--glass-border)] opacity-20 italic text-[8px] font-bold text-center text-slate-500">
                                 - Ready -
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </section>

         {/* Issue Archive & Fleet Control Sidebar */}
         <aside className="space-y-6">
            <div className="flex items-center gap-2 p-1 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
               <button 
                 onClick={() => setActiveTab("issues")}
                 className={clsx(
                   "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   activeTab === "issues" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-indigo-500"
                 )}
               >
                 Signal Archive
               </button>
               <button 
                 onClick={() => setActiveTab("fleet")}
                 className={clsx(
                   "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   activeTab === "fleet" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-indigo-500"
                 )}
               >
                 Fleet Control
               </button>
            </div>

            {activeTab === "issues" ? (
               <div className="space-y-6">
                  <div className="flex items-center gap-3 px-4">
                     <div className="h-1 w-12 bg-rose-500 rounded-full" />
                     <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic">Interference Log</h3>
                  </div>
                  
                  <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl p-8 space-y-6 bg-rose-500/5 h-[65vh] overflow-y-auto custom-scrollbar">
                    {issueReports.length > 0 ? (
                      issueReports.map(report => (
                        <div key={report.id || report._id} className="astu-glass p-6 rounded-2xl border border-rose-500/20 bg-[var(--bg-main)]/40 relative overflow-hidden group hover:border-rose-500/50 transition-all">
                          <div className="flex items-center justify-between mb-3">
                             <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                Priority Alpha
                             </span>
                             <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-50">{new Date(report.created_at).toLocaleTimeString()}</span>
                          </div>
                          <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight mb-1">
                             Node #{desktopCodeById[String(report.desktop_id)] || report.desktop_id}
                          </h4>
                          <p className="text-[10px] font-medium text-[var(--text-muted)] italic leading-relaxed mb-4">
                             {report.description}
                          </p>
                          <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                ID: {studentById[String(report.student_id)] || "UNIDENTIFIED"}
                             </span>
                             <button 
                               onClick={() => handleDeleteIssue(report.id || report._id)}
                               className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                             >
                               Acknowledge
                             </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-40 text-center italic space-y-4">
                         <WifiIcon className="h-12 w-12 text-slate-400" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No signal interference detected.</p>
                      </div>
                    )}
                  </div>
               </div>
            ) : (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 px-4">
                     <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                     <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic">Node Deployment</h3>
                  </div>

                  <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl p-8 bg-indigo-500/5 space-y-8">
                     <button 
                       onClick={() => setShowAddModal(true)}
                       className="astu-btn-premium w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                     >
                       <PlusIcon className="h-5 w-5" />
                       Initialize New Node
                     </button>

                     <div className="space-y-4">
                        <p className="px-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Registry Baseline</p>
                        <div className="space-y-3 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
                           {desktops.map(d => (
                              <div key={d.id} className="astu-glass p-5 rounded-2xl border border-indigo-500/10 flex items-center justify-between group hover:border-indigo-500/30 transition-all bg-[var(--bg-main)]/40">
                                 <div>
                                    <h4 className="text-xs font-black text-[var(--text-main)] italic">Sector #{d.desktop_id}</h4>
                                    <code className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{d.ip_address}</code>
                                 </div>
                                 <button 
                                   onClick={() => { setPendingDeleteDesktop(d); setShowDeleteModal(true); }}
                                   className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                 >
                                    <TrashIcon className="h-4 w-4" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </aside>
      </div>

      {/* Fleet Management Registry */}
      <section className="space-y-6 min-w-0">
         <div className="flex items-center gap-3 px-4">
            <div className="h-1 w-12 bg-sky-500 rounded-full" />
            <h3 className="text-xs font-black text-sky-500 uppercase tracking-[0.3em] font-mono italic">Fleet Management Registry</h3>
         </div>
         
         <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl bg-[var(--glass-bg)]/20 overflow-hidden">
            <div className="overflow-auto custom-scrollbar max-h-[60vh] scroll-smooth">
               <table className="w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-[60]">
                      <tr className="bg-[var(--bg-main)]/95 backdrop-blur-3xl">
                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic min-w-[180px] border-b border-[var(--glass-border)]">Node ID</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic min-w-[160px] border-b border-[var(--glass-border)]">Logic Address</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic min-w-[160px] border-b border-[var(--glass-border)]">Last Broadcast</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic min-w-[160px] border-b border-[var(--glass-border)]">Uplink Status</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic min-w-[180px] border-b border-[var(--glass-border)]">Override Protocol</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic border-b border-[var(--glass-border)]">Purge</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)] text-[var(--text-main)]">
                     {desktops.map(d => (
                       <tr key={d.id} className="group hover:bg-sky-500/[0.03] transition-all duration-500">
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center font-black text-sky-500 text-xs">#{d.desktop_id}</div>
                                <span className="text-xs font-black uppercase italic tracking-tighter">{d.id.slice(-8)}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <code className="text-[10px] font-black text-indigo-500/60 bg-indigo-500/5 px-3 py-1 rounded-full">{d.ip_address}</code>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] opacity-60">
                                <ClockIcon className="h-4 w-4" />
                                {d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleString([], { hour:'2-digit', minute:'2-digit' }) : "---"}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className={clsx(
                               "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic decoration-2 underline-offset-4",
                               d.status === 'available' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                             )}>
                                <div className={`h-1.5 w-1.5 rounded-full ${d.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                {d.status}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <select 
                               value={d.status} 
                               onChange={(e) => handleUpdateStatus(d.id, e.target.value)}
                               className="bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest italic text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                             >
                                <option value="available">Sync Available</option>
                                <option value="busy">Enforce Busy</option>
                                <option value="offline">Force Offline</option>
                                <option value="maintenance">Under Repair</option>
                             </select>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => { setPendingDeleteDesktop(d); setShowDeleteModal(true); }} className="astu-glass p-3 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-md">
                                <TrashIcon className="h-5 w-5" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>
    </div>
  );

  if (user?.role === 'general_admin') {
    return (
      <GeneralAdminLayout user={user}>
        {pageContent}
        
        {/* Modals are still needed */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
             <div className="astu-glass w-full max-w-xl rounded-[3.5rem] border border-indigo-500/30 p-12 shadow-2xl bg-[var(--glass-bg)]/90 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-5 mb-10">
                   <div className="h-14 w-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                      <PlusIcon className="h-7 w-7 text-white" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Initialize Node</h3>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic opacity-60">Register new hardware component</p>
                   </div>
                </div>

                <form onSubmit={handleAddDesktop} className="space-y-8">
                   <div className="space-y-6">
                      <div className="relative group">
                         <CommandLineIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                         <input
                           type="text"
                           required
                           placeholder="Enter Sector Identifier (e.g. LIB-001)"
                           className="w-full h-16 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                           value={newDesktop.desktop_id}
                           onChange={(e) => setNewDesktop({ ...newDesktop, desktop_id: e.target.value })}
                         />
                      </div>
                      <div className="astu-glass px-8 py-6 rounded-[1.5rem] border border-indigo-500/10 flex items-center justify-between shadow-inner">
                         <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Predictive IP Assignment</p>
                            <p className="text-lg font-black text-[var(--text-main)] italic tracking-widest">{getNextIp()}</p>
                         </div>
                         <WifiIcon className="h-8 w-8 text-indigo-500/30" />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-indigo-500 transition-colors">Terminate Protocol</button>
                      <button type="submit" className="astu-btn-premium flex-[1.5] h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20">Complete Initialization</button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
             <div className="astu-glass w-full max-w-lg rounded-[3rem] border border-rose-500/30 p-12 shadow-2xl bg-[var(--glass-bg)]/90 text-center scale-up-center">
                <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl mx-auto flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-rose-500 animate-ping opacity-10 rounded-3xl" />
                   <TrashIcon className="h-10 w-10 text-rose-500" />
                </div>
                <h3 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter mb-4 italic">Purge Sector #{pendingDeleteDesktop?.desktop_id}?</h3>
                <p className="text-sm text-[var(--text-muted)] italic font-medium leading-relaxed opacity-70 mb-10">
                   WARNING: This protocol will permanently segment the node from the network registry. This action is irreversible.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                   <button onClick={() => setShowDeleteModal(false)} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all">Cancel Purge</button>
                   <button onClick={() => handleDeleteDesktop(pendingDeleteDesktop.id)} className="flex-1 h-14 rounded-2xl bg-rose-500 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all">Confirm Segment Purge</button>
                </div>
             </div>
          </div>
        )}
      </GeneralAdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500 flex">
      {/* Librarian Side Nav (Fixed) */}
      <aside className="fixed inset-y-0 left-0 w-72 z-50 p-6 hidden lg:block">
        <div className="h-full astu-glass rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col overflow-hidden shadow-2xl bg-[var(--glass-bg)]/80 backdrop-blur-2xl px-2">
          <div className="px-6 pt-10 pb-8 flex items-center gap-4 group cursor-default">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <BookOpenIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.2em] leading-tight text-nowrap">ASTU Digital</p>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 italic">Fleet Command</p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent opacity-50" />

          <nav className="flex-1 px-2 py-8 space-y-3 overflow-y-auto custom-scrollbar">
             {[
               { label: "Dashboard", to: "/admin", icon: ChartBarIcon },
               { label: "E-book Archive", to: "/librarian-ebooks", icon: BookOpenIcon },
               { label: "Fleet Pool", to: "/desktop-pool", icon: ComputerDesktopIcon, active: true },
               { label: "Protocol Broadcasts", to: "/general-admin-announcements", icon: MegaphoneIcon },
               { label: "Signal Chat", to: "/admin-chat", icon: ChatBubbleLeftRightIcon },
             ].map((item) => (
               <Link
                 key={item.label}
                 to={item.to}
                 className={clsx(
                   "group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                   item.active ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" : "text-[var(--text-muted)] hover:bg-indigo-500/5 hover:text-indigo-500"
                 )}
               >
                 <item.icon className={clsx("h-5 w-5 transition-transform duration-500 group-hover:scale-110", item.active ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                 <span>{item.label}</span>
                 {item.active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
               </Link>
             ))}
          </nav>

          <div className="p-4 border-t border-[var(--glass-border)]">
             <button 
               onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
               className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all duration-500 shadow-lg shadow-rose-500/5 group"
             >
                <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Terminate Uplink
             </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 flex-1 min-h-screen px-4 sm:px-8 py-10">
        <div className="max-w-[1700px] mx-auto">
           {pageContent}
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
           <div className="astu-glass w-full max-w-xl rounded-[3.5rem] border border-indigo-500/30 p-12 shadow-2xl bg-[var(--glass-bg)]/90 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-5 mb-10">
                 <div className="h-14 w-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                    <PlusIcon className="h-7 w-7 text-white" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Initialize Node</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic opacity-60">Register new hardware component</p>
                 </div>
              </div>

              <form onSubmit={handleAddDesktop} className="space-y-8">
                 <div className="space-y-6">
                    <div className="relative group">
                       <CommandLineIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input
                         type="text"
                         required
                         placeholder="Enter Sector Identifier (e.g. LIB-001)"
                         className="w-full h-16 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                         value={newDesktop.desktop_id}
                         onChange={(e) => setNewDesktop({ ...newDesktop, desktop_id: e.target.value })}
                       />
                    </div>
                    <div className="astu-glass px-8 py-6 rounded-[1.5rem] border border-indigo-500/10 flex items-center justify-between shadow-inner">
                       <div>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Predictive IP Assignment</p>
                          <p className="text-lg font-black text-[var(--text-main)] italic tracking-widest">{getNextIp()}</p>
                       </div>
                       <WifiIcon className="h-8 w-8 text-indigo-500/30" />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-indigo-500 transition-colors">Terminate Protocol</button>
                    <button type="submit" className="astu-btn-premium flex-[1.5] h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20">Complete Initialization</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
           <div className="astu-glass w-full max-w-lg rounded-[3rem] border border-rose-500/30 p-12 shadow-2xl bg-[var(--glass-bg)]/90 text-center scale-up-center">
              <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl mx-auto flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 bg-rose-500 animate-ping opacity-10 rounded-3xl" />
                 <TrashIcon className="h-10 w-10 text-rose-500" />
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter mb-4 italic">Purge Sector #{pendingDeleteDesktop?.desktop_id}?</h3>
              <p className="text-sm text-[var(--text-muted)] italic font-medium leading-relaxed opacity-70 mb-10">
                 WARNING: This protocol will permanently segment the node from the network registry. This action is irreversible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all">Cancel Purge</button>
                 <button onClick={() => handleDeleteDesktop(pendingDeleteDesktop.id)} className="flex-1 h-14 rounded-2xl bg-rose-500 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all">Confirm Segment Purge</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
