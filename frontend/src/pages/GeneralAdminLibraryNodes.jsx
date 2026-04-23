import { useEffect, useMemo, useState } from "react";
import api from "../api";
import GeneralAdminLayout from "../components/GeneralAdminLayout";
import {
  BuildingLibraryIcon,
  PlusIcon,
  TrashIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function GeneralAdminLibraryNodes() {
  const [user, setUser] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [students, setStudents] = useState([]);

  const [newLibraryName, setNewLibraryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, libRes, ebookRes, studentsRes] = await Promise.all([
        api.get("/me"),
        api.get("/admin/libraries"),
        api.get("/api/ebooks"),
        api.get("/students/"),
      ]);
      setUser(meRes.data || null);
      setLibraries(libRes.data || []);
      setEbooks(ebookRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load library nodes.");
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

  return (
    <GeneralAdminLayout user={user}>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-center shadow-inner">
                <BuildingLibraryIcon className="h-7 w-7 text-rose-500" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">
                   Node Management
                </h1>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic mt-1">
                   Institutional Hub Architecture
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--glass-bg)] px-4 py-2 rounded-full border border-[var(--glass-border)]">
                {libraries.length} Active Nodes
             </span>
          </div>
        </header>

        {error && (
          <div className="astu-glass rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-rose-500 italic shadow-lg">
            [Protocol Halt]: {error}
          </div>
        )}

        <section className="astu-glass rounded-[3rem] p-10 border border-rose-500/20 shadow-2xl relative overflow-hidden bg-rose-500/5">
           <div className="absolute top-0 right-0 p-12 opacity-[0.05] filter blur-sm">
              <PlusIcon className="h-48 w-48 text-rose-500" />
           </div>
           
           <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tight mb-3">Initialize New Node</h2>
              <p className="text-xs text-[var(--text-muted)] font-bold italic mb-8 leading-relaxed max-w-lg uppercase tracking-widest opacity-60">
                 Provision a new institutional library node to the global grid. Each node acts as an independent data silo with unique e-book indexing and desktop pool management.
              </p>
              
              <form onSubmit={handleAddLibrary} className="flex flex-col sm:flex-row gap-4">
                 <input
                   type="text"
                   value={newLibraryName}
                   onChange={(e) => setNewLibraryName(e.target.value)}
                   placeholder="Enter Domain ID / Library Name..."
                   className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-6 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all shadow-inner"
                 />
                 <button
                   type="submit"
                   disabled={submitting}
                   className="astu-btn-premium px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3 group"
                 >
                   <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                   <span>{submitting ? "Establishing…" : "Establish Node"}</span>
                 </button>
              </form>
           </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="astu-glass h-64 rounded-[2.5rem] border border-[var(--glass-border)] animate-pulse bg-[var(--glass-bg)]/20" />
             ))
          ) : libraries.length === 0 ? (
             <div className="col-span-full py-20 text-center astu-glass rounded-[3rem] border border-dashed border-[var(--glass-border)]">
                <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest italic">No active nodes detected in the network.</p>
             </div>
          ) : (
            libraries.map((lib) => {
              const booksCount = booksByLibrary.get(String(lib.id)) || 0;
              const studentsCount = studentsByLibrary.get(String(lib.id)) || 0;
              return (
                <div key={lib.id} className="group relative">
                   <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                   <div className="astu-glass h-full p-8 rounded-[3rem] border border-[var(--glass-border)] hover:border-rose-500/30 shadow-xl hover:shadow-2xl transition-all duration-500 bg-[var(--glass-bg)]/40 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-start justify-between gap-4 mb-8">
                         <div className="h-20 w-20 rounded-[2rem] bg-rose-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-rose-500/20 transform rotate-3 group-hover:rotate-0 transition-all duration-500 relative">
                            {initials(lib.name)}
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[var(--bg-main)] border-4 border-emerald-500 flex items-center justify-center">
                               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                         </div>
                         <button
                           type="button"
                           onClick={() => handleDeleteLibrary(lib.id)}
                           className="p-3 rounded-2xl bg-rose-500/5 text-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                           title="Decommission Node"
                         >
                           <TrashIcon className="h-5 w-5" />
                         </button>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <h4 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter truncate group-hover:text-rose-500 transition-colors">{lib.name}</h4>
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 italic">Node Architecture: Active</p>
                         </div>

                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                               <BookOpenIcon className="h-4 w-4 text-indigo-500" />
                               <span>{booksCount} Indexed Assets</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                               <UserGroupIcon className="h-4 w-4 text-emerald-500" />
                               <span>{studentsCount} Researchers</span>
                            </div>
                         </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-[var(--glass-border)] flex items-center justify-between">
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">STABLE</span>
                         <button className="flex items-center gap-2 text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest hover:text-rose-500 transition-colors group/link">
                            Control Panel
                            <ArrowRightIcon className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" />
                         </button>
                      </div>
                   </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </GeneralAdminLayout>
  );
}
