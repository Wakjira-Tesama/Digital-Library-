import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import GeneralAdminLayout from "../components/GeneralAdminLayout";
import {
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function AdminChat() {
  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [libraries, setLibraries] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const fileInputRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const initials = (name) => {
    if (!name) return "?";
    const parts = String(name).trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
  };

  const formatTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const fetchMessages = async (activeRole, activeLibraryId) => {
    if (!activeRole) return;
    if (activeRole === "general_admin") {
      if (!activeLibraryId) {
        setMessages([]);
        return;
      }
      const msgsRes = await api.get(
        `/admin/chat/messages?library_id=${activeLibraryId}`,
      );
      setMessages(msgsRes.data || []);
      return;
    }

    const msgsRes = await api.get("/admin/chat/messages");
    setMessages(msgsRes.data || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const meRes = await api.get("/me");
        setCurrentUser(meRes.data || null);
        const currentRole = meRes.data?.role || "";
        setRole(currentRole);

        if (currentRole === "general_admin") {
          const libsRes = await api.get("/libraries");
          const libs = libsRes.data || [];
          setLibraries(libs);

          const initialId = libs.length > 0 ? libs[0].id : "";
          setSelectedLibraryId((prev) => prev || initialId);
        } else {
          setLibraries([]);
          setSelectedLibraryId("");
        }
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load chat.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        await fetchMessages(role, selectedLibraryId);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    if (!role) return;
    if (role === "general_admin" && !selectedLibraryId) return;
    run();
  }, [role, selectedLibraryId]);

  useEffect(() => {
    if (!role) return;
    const id = setInterval(() => {
      fetchMessages(role, selectedLibraryId).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [role, selectedLibraryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() && !attachmentFile) return;
    setSending(true);
    setError("");

    try {
      let attachmentMeta = null;
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("chat_file", attachmentFile);
        const uploadRes = await api.post("/admin/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        attachmentMeta = uploadRes.data;
      }

      const payload = {
        message: draft,
        category: "Message",
      };

      if (role === "general_admin" && selectedLibraryId) {
        payload.target_library_id = selectedLibraryId;
      }

      if (attachmentMeta) {
        payload.attachment_url = attachmentMeta.url;
        payload.attachment_name = attachmentMeta.name;
        payload.attachment_type = attachmentMeta.mime_type;
      }

      await api.post("/admin/chat/messages", payload);
      setDraft("");
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchMessages(role, selectedLibraryId);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const filteredLibraries = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return libraries;
    return (libraries || []).filter((l) =>
      String(l.name || "")
        .toLowerCase()
        .includes(q),
    );
  }, [libraries, conversationSearch]);

  const activeConversationTitle = useMemo(() => {
    if (role === "general_admin") {
      const lib = (libraries || []).find((l) => l.id === selectedLibraryId);
      return lib?.name ? `${lib.name} Librarian` : "Select Node";
    }
    return "Global Uplink";
  }, [role, libraries, selectedLibraryId]);

  const accentColor = role === "general_admin" ? "rose" : "indigo";
  const avatarText = initials(activeConversationTitle);

  const chatPanel = (
    <div className="astu-glass rounded-[3rem] border border-[var(--glass-border)] shadow-2xl overflow-hidden bg-[var(--glass-bg)]/60 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] min-h-[75vh]">
        {/* Conversations Sidebar */}
        <aside className="border-b md:border-b-0 md:border-r border-[var(--glass-border)] flex flex-col">
          <div className="p-8">
            <h2 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter mb-6">Communications</h2>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                 <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                placeholder="Search frequencies..."
                className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-14 pr-6 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
            {role === "general_admin" ? (
              filteredLibraries.map((lib) => {
                const isActive = lib.id === selectedLibraryId;
                return (
                  <button
                    key={lib.id}
                    type="button"
                    onClick={() => setSelectedLibraryId(lib.id)}
                    className={`
                      w-full group flex items-center gap-4 rounded-[2rem] px-6 py-5 text-left transition-all duration-500
                      ${isActive 
                        ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20 translate-x-2" 
                        : "hover:bg-rose-500/5 text-[var(--text-muted)] hover:text-rose-500"
                      }
                    `}
                  >
                    <div className="relative shrink-0">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 ${isActive ? "bg-white/20 shadow-inner" : "bg-rose-500/10 text-rose-500 group-hover:scale-110"}`}>
                        {initials(lib.name)}
                      </div>
                      <span className={`absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full ring-4 ${isActive ? "bg-white ring-rose-500" : "bg-emerald-500 ring-[var(--bg-main)] shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`font-black uppercase tracking-tighter truncate ${isActive ? "text-white" : "text-[var(--text-main)]"}`}>
                          {lib.name}
                        </div>
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest mt-1 italic truncate opacity-70 ${isActive ? "text-white" : "text-rose-500/60"}`}>
                        Institutional Node
                      </div>
                    </div>
                    {isActive && <ChevronRightIcon className="h-4 w-4 text-white/60" />}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                className="w-full group flex items-center gap-4 rounded-[2rem] bg-indigo-500 text-white p-6 text-left shadow-xl shadow-indigo-500/20"
              >
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                    RA
                  </div>
                  <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-indigo-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black uppercase tracking-tighter text-white">Global Admin</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-1 italic text-white/70">Central Uplink</div>
                </div>
              </button>
            )}

            {!loading && filteredLibraries.length === 0 && role === "general_admin" && (
              <div className="px-8 py-12 text-center">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-40">No active nodes detected on this frequency.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Message Thread */}
        <section className="flex flex-col relative h-[75vh]">
          <header className="px-10 py-6 border-b border-[var(--glass-border)] flex items-center justify-between gap-4 bg-[var(--glass-bg)]/20">
            <div className="flex items-center gap-5 min-w-0">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shrink-0 ${role === "general_admin" ? "bg-rose-500 text-white shadow-rose-500/20 animate-pulse" : "bg-indigo-500 text-white shadow-indigo-500/20 animate-pulse"}`}>
                {avatarText}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter truncate">
                  {activeConversationTitle}
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className={`text-[10px] font-black uppercase tracking-widest italic ${role === "general_admin" ? "text-rose-500" : "text-indigo-500"}`}>
                      Secure Link Established
                   </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="astu-glass p-3 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 transition-all shadow-md">
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button className="astu-glass p-3 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 transition-all shadow-md">
                <VideoCameraIcon className="h-5 w-5" />
              </button>
              <button className="astu-glass p-3 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 transition-all shadow-md">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
            {error && (
              <div className="astu-glass rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 italic shadow-lg">
                [Signal Warning]: {error}
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                 <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Archive...</p>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                 <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4 text-slate-400" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Archival records empty</p>
                 <p className="text-[9px] font-black uppercase tracking-widest italic mt-2">Initialize conversation below</p>
              </div>
            )}

            <div className="space-y-8">
              {messages.map((m, idx) => {
                const mine = Boolean(role && m.from_role === role);
                return (
                  <div key={m.id || idx} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div className={`
                      group relative max-w-[80%] p-6 rounded-[2.5rem] border transition-all duration-500
                      ${mine 
                        ? `${role === 'general_admin' ? 'bg-rose-500 border-rose-500 text-white shadow-2xl shadow-rose-500/20 rounded-tr-md' : 'bg-indigo-500 border-indigo-500 text-white shadow-2xl shadow-indigo-500/20 rounded-tr-md'}` 
                        : "astu-glass bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-main)] rounded-tl-md"
                      }
                    `}>
                      {m.message && (
                        <div className={`text-sm leading-relaxed font-medium italic whitespace-pre-line ${mine ? "text-white/95" : "text-[var(--text-main)]"}`}>
                          {m.message}
                        </div>
                      )}

                      {m.attachment_url && (
                        <div className="mt-4 overflow-hidden rounded-3xl group/attach relative">
                          {m.attachment_type && m.attachment_type.startsWith("image/") ? (
                            <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block relative">
                              <img src={m.attachment_url} alt={m.attachment_name || "attachment"} className="w-full h-auto transform group-hover/attach:scale-110 transition-transform duration-700" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/attach:opacity-100 transition-opacity flex items-center justify-center">
                                 <MagnifyingGlassIcon className="h-8 w-8 text-white" />
                              </div>
                            </a>
                          ) : (
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`
                                flex items-center gap-3 p-4 rounded-2xl border transition-all
                                ${mine ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-slate-500/5 border-[var(--glass-border)] hover:bg-rose-500/5"}
                              `}
                            >
                              <PaperClipIcon className="h-5 w-5" />
                              <div className="min-w-0">
                                 <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">{m.attachment_name || "DATA_STREAM.dat"}</p>
                                 <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Establish Access</p>
                              </div>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest mt-2 opacity-40 px-2 italic font-mono`}>
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className="px-10 py-8 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/30 backdrop-blur-3xl">
            <form onSubmit={handleSend} className="max-w-5xl mx-auto space-y-4">
               {attachmentFile && (
                  <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                     <PaperClipIcon className="h-4 w-4 text-rose-500" />
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest truncate">{attachmentFile.name}</span>
                     <button type="button" onClick={() => setAttachmentFile(null)} className="ml-auto text-rose-500 hover:scale-125 transition-transform">×</button>
                  </div>
               )}
               
               <div className="flex items-center gap-4">
                 <input
                   ref={fileInputRef}
                   type="file"
                   className="hidden"
                   onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                 />
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="astu-glass h-14 w-14 rounded-2xl border border-[var(--glass-border)] text-slate-400 hover:text-rose-500 hover:scale-105 transition-all shadow-lg grid place-items-center"
                 >
                   <PaperClipIcon className="h-6 w-6" />
                 </button>

                 <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Input secure message sequence..."
                      className="w-full h-14 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)]/50 px-8 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                       <button type="button" className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                          <FaceSmileIcon className="h-5 w-5" />
                       </button>
                    </div>
                 </div>

                 <button
                   type="submit"
                   disabled={sending}
                   className={`h-14 w-28 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 hover:scale-105 active:scale-95 ${role === 'general_admin' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-500 shadow-indigo-500/20'}`}
                 >
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">{sending ? "Syncing" : "Send"}</span>
                   <PaperAirplaneIcon className={`h-5 w-5 text-white ${sending ? "animate-ping" : "-rotate-45 group-hover:translate-x-1"}`} />
                 </button>
               </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );

  if (role === "general_admin") {
    return <GeneralAdminLayout user={currentUser}>{chatPanel}</GeneralAdminLayout>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
         <header className="mb-10 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter">Communications Hub</h1>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic mt-0.5">Secure Librarian Uplink</p>
            </div>
         </header>
         {chatPanel}
      </div>
      
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
