import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { LockClosedIcon, UserIcon, IdentificationIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function LoginPage({ role: loginRole }) {
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData();
    if (loginRole === "student") {
      formData.append("student_id", studentId);
      formData.append("email", email);
    } else {
      formData.append("username", email);
      formData.append("password", password);
    }

    try {
      const response = await api.post(
        loginRole === "student" ? "/students/login" : "/token",
        formData,
      );
      localStorage.setItem("token", response.data.access_token);

      const me = await api.get("/me");
      const userRole = me.data.role;

      if (loginRole === "admin") {
        if (userRole === "general_admin") {
          navigate("/general-admin-dashboard");
        } else if (userRole === "librarian") {
          navigate("/admin");
        } else {
          localStorage.removeItem("token");
          setError("Access Denied: Administrative credentials required.");
        }
      } else {
        if (userRole === "student") {
          navigate("/dashboard");
        } else {
          localStorage.removeItem("token");
          setError("Access Denied: Student credentials required.");
        }
      }
    } catch (err) {
      const backendDetail = err?.response?.data?.detail;
      setError(backendDetail || "Authentication Protocol Failure: Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-600">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/[0.04] blur-[150px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/[0.03] blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />
      
      <div className="astu-glass w-full max-w-lg rounded-[4.5rem] border-2 border-[var(--glass-border)] shadow-[0_50px_150px_-30px_rgba(0,0,0,0.15)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-1000 bg-[var(--glass-bg)]/40 backdrop-blur-3xl px-12 py-16">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
        
        <div className="text-center space-y-10 relative z-10">
          <div className="relative inline-block group">
             <div className="absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full animate-pulse group-hover:bg-indigo-500/40 transition-all duration-700" />
             <div className="relative h-20 w-20 mx-auto rounded-[1.75rem] bg-white dark:bg-slate-900 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <ShieldCheckIcon className="h-10 w-10" />
             </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[var(--text-main)] uppercase tracking-tight leading-none">
              {loginRole === "admin" ? "Admin Uplink" : "Student Uplink"}
            </h2>
            <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider leading-none">
              Authorize Terminal Access
            </p>
          </div>
        </div>

        <form className="mt-16 space-y-10 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-6">
            {loginRole === "student" ? (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider px-4 opacity-70">Identity Hash</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-indigo-500/40 group-focus-within:text-indigo-500 transition-colors">
                      <IdentificationIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-semibold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100 uppercase tracking-wider"
                      placeholder="Student ID (ugr/1234/12)"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] px-4 italic opacity-70">Node Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-indigo-500/40 group-focus-within:text-indigo-500 transition-colors">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100 italic font-medium"
                      placeholder="Email Protocol"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] px-4 italic opacity-70">Admin Protocol</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-indigo-500/40 group-focus-within:text-indigo-500 transition-colors">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)] italic font-medium"
                      placeholder="Admin Registry"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] px-4 italic opacity-70">Cipher Stream</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-indigo-500/40 group-focus-within:text-indigo-500 transition-colors">
                      <LockClosedIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)] italic"
                      placeholder="Secure Cipher"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="px-8 py-4 rounded-[1.5rem] bg-red-500/5 border border-red-500/20 text-[10px] font-black text-red-600 dark:text-red-400 text-center uppercase italic tracking-widest animate-in fade-in slide-in-from-top-2 duration-500 transition-all">
              {error}
            </div>
          )}

          <div className="pt-4 space-y-8">
            <button
              type="submit"
              disabled={loading}
              className="astu-btn-premium w-full py-6 rounded-[1.5rem] text-[11px] font-semibold text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-4 group active:scale-95 transition-all uppercase tracking-wider"
            >
              {loading ? "Initializing..." : (<><LockClosedIcon className="h-4 w-4 group-hover:rotate-12 transition-transform" /> Sign In To Node</>)}
            </button>

            {loginRole !== "admin" && (
              <div className="text-center">
                <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic opacity-60">No Partition Established?</span>{" "}
                <Link
                  to="/register"
                  className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-all text-[11px] uppercase tracking-widest italic underline decoration-indigo-500/20 underline-offset-8 ml-2"
                >
                  Create Identity
                </Link>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Decorative Branding */}
      <div className="absolute top-10 left-10 flex items-center gap-4 opacity-40 group hover:opacity-100 transition-opacity">
        <div className="h-10 w-10 rounded-xl astu-accent-gradient flex items-center justify-center shadow-lg rotate-3">
           <ShieldCheckIcon className="h-6 w-6 text-white" />
        </div>
        <div>
           <p className="text-sm font-bold text-[var(--text-main)] leading-none uppercase tracking-tight">ASTU Archival</p>
           <p className="text-[8px] font-semibold text-indigo-500 uppercase tracking-widest mt-1 leading-none">Verified Protocol</p>
        </div>
      </div>
    </div>
  );
}
