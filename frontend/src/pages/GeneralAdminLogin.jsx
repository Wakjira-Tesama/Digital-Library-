import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  FingerPrintIcon,
  KeyIcon
} from "@heroicons/react/24/outline";

export default function GeneralAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      
      const res = await api.post("/token", formData);
      localStorage.setItem("token", res.data.access_token);
      
      navigate("/general-admin-dashboard");
    } catch (err) {
      console.error("Login fail:", err);
      setError("AUTHENTICATION FAILURE: ACCESS DENIED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      {/* Login Shell */}
      <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-1000">
        <div className="astu-glass rounded-[4rem] border border-[var(--glass-border)] p-16 shadow-2xl relative overflow-hidden bg-[var(--glass-bg)]/30 backdrop-blur-3xl">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-40" />
           
           <div className="flex flex-col items-center text-center space-y-12">
              <div className="relative group">
                 <div className="h-24 w-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700">
                    <ShieldCheckIcon className="h-12 w-12 text-rose-500" />
                 </div>
                 <div className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 text-[10px] font-black italic">α</div>
              </div>

              <div className="space-y-4">
                 <h1 className="text-5xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">
                    Alpha Access <span className="text-rose-500 not-italic">Secure</span>
                 </h1>
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono italic opacity-60">
                    SDPMS Central Command Hub
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-8">
                 <div className="space-y-6">
                    {/* ID Upload */}
                    <div className="group relative">
                       <EnvelopeIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                       <input
                          type="email"
                          required
                          placeholder="Administrator ID (Email)"
                          className="w-full h-16 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                       />
                    </div>
                    {/* Key Phrase */}
                    <div className="group relative">
                       <KeyIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                       <input
                          type="password"
                          required
                          placeholder="Cipher Key (Password)"
                          className="w-full h-16 rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--bg-main)]/50 pl-16 pr-8 text-xs font-black italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                       />
                    </div>
                 </div>

                 {error && (
                   <div className="astu-glass px-6 py-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-[10px] font-black text-rose-500 uppercase tracking-widest italic animate-bounce shadow-lg">
                      {error}
                   </div>
                 )}

                 <button
                   type="submit"
                   disabled={loading}
                   className="astu-btn-premium w-full h-18 rounded-[1.5rem] text-white flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
                 >
                    {loading ? (
                      <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FingerPrintIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        Initiate Sequence
                      </>
                    )}
                 </button>
              </form>

              <div className="pt-8 flex flex-col items-center gap-4 opacity-40">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black uppercase tracking-widest">TLS 1.3 Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                       <span className="text-[8px] font-black uppercase tracking-widest">RSA 4096 AES</span>
                    </div>
                 </div>
                 <p className="text-[8px] font-bold text-[var(--text-muted)] italic">UNAUTHORIZED ACCESS IS PROHIBITED BY SYSTEM PROTOCOL</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
