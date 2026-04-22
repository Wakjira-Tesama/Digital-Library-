import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import {
  BookOpenIcon,
  BellIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  PencilSquareIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  IdentificationIcon,
  TagIcon,
  LinkIcon,
  DocumentArrowUpIcon,
  NoSymbolIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function EbookAdminDashboard() {
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [ebooks, setEbooks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    author: "",
    description: "",
    category: "",
    tags: "",
    coverUrl: "",
    fileUrl: "",
    externalLink: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const meRes = await api.get("/me");
        setCurrentUser(meRes.data);
        if (meRes.data?.library_id) {
          setSelectedLibraryId(String(meRes.data.library_id));
        }
      } catch (err) {
        console.error(err);
        setError("Synchronization failure: Archive link severed.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchEbooks = async () => {
      if (!selectedLibraryId) return;
      try {
        const res = await api.get("/api/ebooks", { params: { library_id: selectedLibraryId } });
        setEbooks(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetchEbooks();
  }, [selectedLibraryId]);

  const resetForm = () => {
    setForm({ id: "", title: "", author: "", description: "", category: "", tags: "", coverUrl: "", fileUrl: "", externalLink: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title required for archival.");
    setSaving(true);
    setError("");
    try {
      await api.post("/api/ebooks", { ...form, library_id: selectedLibraryId });
      resetForm();
      setShowForm(false);
      const res = await api.get("/api/ebooks", { params: { library_id: selectedLibraryId } });
      setEbooks(res.data || []);
    } catch (err) { setError("Data preservation failed."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (ebook) => {
    if (!window.confirm("Purge this asset from the digital archive?")) return;
    try {
      await api.delete(`/api/ebooks/${ebook._id || ebook.id}`);
      setEbooks(prev => prev.filter(b => (b._id || b.id) !== (ebook._id || ebook.id)));
    } catch (err) { setError("Deletion protocol failed."); }
  };

  const filteredEbooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ebooks;
    return ebooks.filter(b => [b.title, b.author, b.category].some(f => String(f || "").toLowerCase().includes(q)));
  }, [ebooks, query]);

  const stats = useMemo(() => ({
    total: ebooks.length,
    new: ebooks.filter(e => e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 7 * 24 * 3600000)).length,
    cats: new Set(ebooks.map(e => e.category)).size,
    available: ebooks.filter(e => e.fileUrl || e.externalLink).length
  }), [ebooks]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 italic">Accessing Archival Vault...</p>
      </div>
    );
  }

  const pageContent = (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner group">
              <BookOpenIcon className="h-8 w-8 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                 Archival Registry
              </h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic mt-1 leading-none">
                 Digital Asset Inventory & Lifecycle
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
           {[
             { label: "Assets", val: stats.total, color: "indigo", icon: BookOpenIcon },
             { label: "Ingested (7d)", val: stats.new, color: "emerald", icon: SparklesIcon },
             { label: "Sectors", val: stats.cats, color: "sky", icon: Squares2X2Icon },
           ].map(stat => (
             <div key={stat.label} className="astu-glass px-6 py-3 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 shadow-lg">
                <div className={`h-10 w-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 leading-none mb-1">{stat.label}</p>
                   <p className="text-xl font-black text-[var(--text-main)] leading-none italic">{stat.val}</p>
                </div>
             </div>
           ))}
           <button 
             onClick={() => { resetForm(); setShowForm(true); }}
             className="astu-btn-premium h-14 px-8 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20"
           >
             <PlusIcon className="h-5 w-5" />
             Register Asset
           </button>
        </div>
      </header>

      {showForm && (
        <section className="astu-glass rounded-[3.5rem] p-12 border border-indigo-500/30 shadow-2xl relative overflow-hidden bg-indigo-500/[0.03] animate-in slide-in-from-top-6 duration-700">
           <div className="absolute -top-12 -right-12 h-64 w-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                 <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg">
                    <DocumentArrowUpIcon className="h-6 w-6 text-white" />
                 </div>
                 <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tight">
                    {form.id ? "Asset Modification" : "Asset Ingestion"}
                 </h2>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:scale-110 transition-transform"
              >
                Abort Protocol
              </button>
           </div>

           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                 <div className="group relative">
                    <IdentificationIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Transmission Title *"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      required
                    />
                 </div>
                 <div className="group relative">
                    <IdentificationIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Author / Architect"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.author}
                      onChange={e => setForm({...form, author: e.target.value})}
                    />
                 </div>
                 <div className="group relative">
                    <Squares2X2Icon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Classification / Category"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                    />
                 </div>
                 <textarea
                    rows={4}
                    placeholder="Input abstract / description sequence..."
                    className="w-full rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--bg-main)]/50 p-6 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner resize-none"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                 />
              </div>
              
              <div className="space-y-6">
                 <div className="group relative">
                    <TagIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Meta Tags (comma separated)"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.tags}
                      onChange={e => setForm({...form, tags: e.target.value})}
                    />
                 </div>
                 <div className="group relative">
                    <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="url"
                      placeholder="Visual Identifier URL (Cover)"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.coverUrl}
                      onChange={e => setForm({...form, coverUrl: e.target.value})}
                    />
                 </div>
                 <div className="group relative">
                    <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="url"
                      placeholder="Data Stream URL (PDF File)"
                      className="w-full h-16 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
                      value={form.fileUrl}
                      onChange={e => setForm({...form, fileUrl: e.target.value})}
                    />
                 </div>
                 <button 
                   type="submit" 
                   disabled={saving}
                   className="astu-btn-premium w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-4 transition-all hover:scale-[1.02]"
                 >
                    {saving ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <DocumentArrowUpIcon className="h-6 w-6" />}
                    {saving ? "Ingesting Data..." : form.id ? "Update Archive Record" : "Finalize Ingestion"}
                 </button>
              </div>
           </form>
        </section>
      )}

      {/* Control Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-4">
         <div className="relative group max-w-xl flex-1">
            <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search archival database..."
              className="w-full h-14 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-6 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-inner"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx("h-12 w-12 rounded-xl flex items-center justify-center transition-all", viewMode === 'grid' ? "bg-indigo-500 text-white shadow-lg" : "astu-glass text-slate-400 hover:text-indigo-500")}
            >
               <Squares2X2Icon className="h-6 w-6" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={clsx("h-12 w-12 rounded-xl flex items-center justify-center transition-all", viewMode === 'list' ? "bg-indigo-500 text-white shadow-lg" : "astu-glass text-slate-400 hover:text-indigo-500")}
            >
               <ListBulletIcon className="h-6 w-6" />
            </button>
         </div>
      </div>

      {/* Asset Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {filteredEbooks.map(ebook => (
             <div key={ebook._id || ebook.id} className="astu-glass rounded-[2.5rem] border border-[var(--glass-border)] overflow-hidden group hover:border-indigo-500/40 hover:scale-[1.02] transition-all duration-500 shadow-xl bg-[var(--glass-bg)]/20">
                <div className="h-64 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                   {ebook.coverUrl ? (
                     <img src={ebook.coverUrl} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                   ) : (
                     <BookOpenIcon className="h-20 w-20 text-indigo-500/20" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                   <div className="absolute top-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(ebook); }} className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors">
                         <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ebook); }} className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-rose-500 transition-colors">
                         <TrashIcon className="h-5 w-5" />
                      </button>
                   </div>
                </div>
                <div className="p-8">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{ebook.category || "General"}</span>
                      {(!ebook.fileUrl && !ebook.externalLink) && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-widest italic flex items-center gap-1">
                           <NoSymbolIcon className="h-3 w-3" /> External Only
                        </span>
                      )}
                   </div>
                   <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-2 group-hover:text-indigo-500 transition-colors truncate">{ebook.title}</h3>
                   <p className="text-xs font-bold text-[var(--text-muted)] italic opacity-60 mb-6 truncate">{ebook.author || "Architect Unknown"}</p>
                   <div className="flex flex-wrap gap-2">
                      {(ebook.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">#{tag}</span>
                      ))}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] overflow-hidden shadow-2xl bg-[var(--glass-bg)]/20">
           <table className="w-full">
              <thead>
                 <tr className="border-b border-[var(--glass-border)] bg-indigo-500/5">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Asset Header</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Categorization</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Archival Meta</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Override Protocols</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)] text-[var(--text-main)]">
                 {filteredEbooks.map(ebook => (
                   <tr key={ebook._id || ebook.id} className="group hover:bg-indigo-500/[0.03] transition-all">
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-6">
                            <div className="h-14 w-10 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                               {ebook.coverUrl && <img src={ebook.coverUrl} className="w-full h-full object-cover opacity-60" />}
                            </div>
                            <div>
                               <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-indigo-500 transition-colors">{ebook.title}</h4>
                               <p className="text-[10px] font-bold text-[var(--text-muted)] italic opacity-60">{ebook.author}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{ebook.category}</span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-wrap gap-2 max-w-[200px]">
                            {(ebook.tags || []).slice(0, 4).map(t => (
                              <span key={t} className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">#{t}</span>
                            ))}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleEdit(ebook)} className="astu-glass h-12 w-12 rounded-2xl border border-[var(--glass-border)] flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all shadow-md">
                               <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(ebook)} className="astu-glass h-12 w-12 rounded-2xl border border-[var(--glass-border)] flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-md">
                               <TrashIcon className="h-5 w-5" />
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500 flex">
      {/* Librarian Side Nav (Fixed) */}
      <aside className="fixed inset-y-0 left-0 w-80 z-50 p-6 hidden lg:block">
        <div className="h-full astu-glass rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col overflow-hidden shadow-2xl bg-[var(--glass-bg)]/80 backdrop-blur-2xl px-4">
          <div className="px-8 pt-10 pb-8 flex items-center gap-4 group cursor-default">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] leading-tight">ASTU Digital</p>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 italic">Archival Vault</p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent opacity-50" />

          <nav className="flex-1 px-2 py-8 space-y-3 overflow-y-auto custom-scrollbar">
             {[
               { label: "Dashboard", to: "/admin", icon: ChartBarIcon },
               { label: "E-book Archive", to: "/librarian-ebooks", icon: BookOpenIcon, active: true },
               { label: "Fleet Pool", to: "/desktop-pool", icon: ComputerDesktopIcon },
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

          <div className="p-6 border-t border-[var(--glass-border)]">
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

      <main className="lg:ml-80 flex-1 min-h-screen px-6 sm:px-10 py-10">
        <div className="max-w-[1600px] mx-auto">
           {pageContent}
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      </main>
    </div>
  );
}
