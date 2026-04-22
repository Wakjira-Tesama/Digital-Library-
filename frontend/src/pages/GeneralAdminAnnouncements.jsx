import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import GeneralAdminLayout from "../components/GeneralAdminLayout";
import {
  ComputerDesktopIcon,
  BookOpenIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PlusIcon,
  PaperAirplaneIcon,
  ChevronRightIcon,
  UsersIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function GeneralAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_members");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("");
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const isGeneralAdmin = role === "general_admin";
  const accentColor = isGeneralAdmin ? "rose" : "indigo";

  const isImportant = (value) => value === "high" || value === "urgent";

  const audienceLabel = (value) => {
    switch (value) {
      case "students_only": return "Students Only";
      case "staff_only": return "Staff Only";
      case "all_members":
      default: return "All Members";
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get("/me").then((res) => {
      setUser(res.data || null);
      setRole(res.data?.role || "");
    }).catch(() => setRole(""));
  }, []);

  const normalized = useMemo(() => {
    return (announcements || []).map((a) => ({
      id: a.id || a._id,
      title: a.title || "",
      body: a.body || "",
      created_at: a.created_at,
      audience: a.audience || "all_members",
      priority: a.priority || "normal",
      creator_role: a.creator_role || "",
      library_id: a.library_id || null,
    }));
  }, [announcements]);

  const pinnedAnnouncements = useMemo(
    () => normalized.filter((a) => isImportant(a.priority)),
    [normalized]
  );

  const recentAnnouncements = useMemo(
    () => normalized.filter((a) => !isImportant(a.priority)),
    [normalized]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/admin/announcements", { title, body, audience, priority });
      setTitle("");
      setBody("");
      setAudience("all_members");
      setPriority("normal");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    setError("");
    try {
      await api.delete(`/admin/announcements/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete announcement.");
    }
  };

  const pageContent = (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className={`h-14 w-14 rounded-2xl bg-${accentColor}-500/5 border border-${accentColor}-500/20 flex items-center justify-center shadow-inner`}>
              <MegaphoneIcon className={`h-7 w-7 text-${accentColor}-500`} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                 Strategic Hub
              </h1>
              <p className={`text-[10px] font-black text-${accentColor}-500 uppercase tracking-[0.3em] font-mono italic mt-1`}>
                 Institutional Broadcast Protocol
              </p>
           </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className={`astu-btn-premium px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-${accentColor}-500/20 flex items-center gap-3 group`}
        >
          <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>Broadcast Transmission</span>
        </button>
      </header>

      {showForm && (
        <section className={`astu-glass rounded-[3rem] p-10 border border-${accentColor}-500/20 shadow-2xl relative overflow-hidden bg-${accentColor}-500/5 animate-in slide-in-from-top-4 duration-700`}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] filter blur-sm">
             <PaperAirplaneIcon className={`h-48 w-48 text-${accentColor}-500`} />
          </div>
          
          <div className="relative z-10">
             <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tight mb-8">Initialize Broadcast</h2>
             
             <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
               {error && (
                 <div className="astu-glass rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 italic">
                   [Protocol Halt]: {error}
                 </div>
               )}

               <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Subject Header *"
                    className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <textarea
                    rows={6}
                    placeholder="Input transmission body sequence..."
                    className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="all_members">Target: All Members</option>
                    <option value="students_only">Target: Students Only</option>
                    <option value="staff_only">Target: Staff Only</option>
                  </select>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="normal">Priority: Standard</option>
                    <option value="high">Priority: Elevated</option>
                    <option value="urgent">Priority: Critical</option>
                  </select>
               </div>

               <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--glass-border)]">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                  >
                    Abort Sequence
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`astu-btn-premium px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-${accentColor}-500/20 flex items-center gap-3`}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span>{submitting ? "Transmitting…" : "Execute Broadcast"}</span>
                  </button>
               </div>
             </form>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-12">
         {/* Pinned / Critical */}
         <section className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-1 w-12 bg-rose-500 rounded-full" />
               <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic">Critical Priority Nodes</h3>
            </div>

            {loading && <div className="text-[10px] font-black text-[var(--text-muted)] uppercase animate-pulse">Scanning Archive…</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pinnedAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="astu-glass p-8 rounded-[3rem] border border-rose-500/30 bg-rose-500/5 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500"
                >
                  <div className="absolute -top-4 -right-4 h-24 w-24 bg-rose-500/10 blur-2xl rounded-full" />
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-rose-500/20">CRITICAL</span>
                       <div className="astu-glass px-3 py-1 rounded-full border border-white/10 text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">
                          {audienceLabel(a.audience)}
                       </div>
                    </div>
                    {isGeneralAdmin && (
                      <button onClick={() => handleDelete(a.id)} className="text-rose-500/40 hover:text-rose-500 transition-colors">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter mb-4 decoration-rose-500/30 underline-offset-8">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed italic opacity-80 mb-8">
                    {a.body}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-60">
                          <UsersIcon className="h-4 w-4" />
                          <span>{a.creator_role === "librarian" ? "Admin Node" : "Global Root"}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-60">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDate(a.created_at)}</span>
                       </div>
                    </div>
                    <button className="h-8 w-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                       <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && pinnedAnnouncements.length === 0 && (
                <div className="col-span-full py-12 text-center astu-glass rounded-[3rem] border border-dashed border-[var(--glass-border)] opacity-40 italic">
                  No high-priority broadcasts active.
                </div>
              )}
            </div>
         </section>

         {/* Recent / Log */}
         <section className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-1 w-12 bg-indigo-500 rounded-full" />
               <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic">Broadcast Archive Log</h3>
            </div>

            <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden bg-[var(--glass-bg)]/20">
               <div className="divide-y divide-[var(--glass-border)]">
                  {recentAnnouncements.map((a) => (
                    <div key={a.id} className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-indigo-500/5 transition-all duration-500">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="astu-glass px-3 py-1 rounded-full border border-indigo-500/10 bg-indigo-500/5 text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">
                              {audienceLabel(a.audience)}
                           </div>
                           <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono opacity-50">{formatDate(a.created_at)}</span>
                        </div>
                        <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter group-hover:text-indigo-500 transition-colors mb-2">{a.title}</h4>
                        <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed italic opacity-70 group-hover:opacity-90 transition-opacity line-clamp-2 max-w-4xl">{a.body}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        {isGeneralAdmin && (
                           <button onClick={() => handleDelete(a.id)} className="astu-glass p-3 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow-md">
                              <TrashIcon className="h-5 w-5" />
                           </button>
                        )}
                        <button className="astu-glass p-4 rounded-[2rem] border border-[var(--glass-border)] text-slate-400 hover:text-indigo-500 hover:scale-110 transition-all shadow-lg group/btn bg-[var(--bg-main)]">
                           <ChevronRightIcon className="h-6 w-6 transform group-hover/btn:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!loading && recentAnnouncements.length === 0 && (
                    <div className="py-20 text-center opacity-40 italic">No historical broadcasts available in the registry.</div>
                  )}
               </div>
            </div>
         </section>
      </div>
    </div>
  );

  if (isGeneralAdmin) {
    return <GeneralAdminLayout user={user}>{pageContent}</GeneralAdminLayout>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500 flex">
      {/* Librarian Side Nav (Fixed to match overall admin pattern) */}
      <aside className="fixed inset-y-0 left-0 w-80 z-50 p-6 hidden lg:block">
        <div className="h-full astu-glass rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col overflow-hidden shadow-2xl bg-[var(--glass-bg)]/80 backdrop-blur-2xl">
          <div className="px-8 pt-10 pb-8">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <MegaphoneIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] leading-tight">
                  ASTU Digital
                </p>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 italic">
                   Administrative Link
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
               { label: "Announcements", to: "/general-admin-announcements", icon: MegaphoneIcon, active: true },
               { label: "Chat Support", to: "/admin-chat", icon: ChatBubbleLeftRightIcon },
             ].map((item) => {
               const Icon = item.icon;
               const active = item.active;
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
        </div>
      </aside>

      <main className="lg:ml-80 flex-1 min-h-screen px-6 sm:px-10 py-10">
        <div className="max-w-7xl mx-auto">
           {pageContent}
        </div>
        
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      </main>
    </div>
  );
}
