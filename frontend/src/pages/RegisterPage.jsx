import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Tesseract from "tesseract.js";
import api from "../api";
import { UserPlusIcon, CameraIcon, CloudArrowUpIcon, CheckBadgeIcon, ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [checkingId, setCheckingId] = useState(false);
  const [idCheckMessage, setIdCheckMessage] = useState("");
  const [idCheckSuccess, setIdCheckSuccess] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const idVerifiedRef = useRef(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (!detail) return fallback;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
    }
    return JSON.stringify(detail);
  };

  const extractStudentIdFromImage = async (file) => {
    const result = await Tesseract.recognize(file, "eng");
    const rawText = result?.data?.text || "";

    // Normalize: collapse whitespace, replace common OCR misreads
    const text = rawText
      .replace(/\s+/g, " ")                  // collapse whitespace
      .replace(/[|\\]/g, "/")               // | or \ misread as /
      .replace(/[oO]/g, (m, offset, str) => {
        // Only replace O->0 inside what looks like an ID number context
        const before = str.slice(Math.max(0, offset - 5), offset);
        return /ugr|\/\d/i.test(before) ? "0" : m;
      });

    // Try multiple patterns (strict → loose)
    const patterns = [
      /ugr\s*[\/\\|]\s*\d{4,6}\s*[\/\\|]\s*\d{2}/i,   // standard
      /ugr\s*\d{4,6}\s*[\/\\|]\s*\d{2}/i,               // missing first slash
      /ugr[^\d]{0,3}(\d{4,6})[^\d]{1,3}(\d{2})\b/i,    // any separators
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Normalize to canonical form ugr/XXXXX/XX
        const normalized = match[0]
          .replace(/[^\w]/g, (c) => (/\d/.test(c) ? c : "/"))
          .replace(/ugr/i, "ugr")
          .replace(/\/+/g, "/")
          .toLowerCase();
        return normalized;
      }
    }

    return null; // nothing found
  };

  // Fuzzy comparison: strips non-alphanumeric and compares digits
  const fuzzyIdMatch = (extracted, typed) => {
    if (!extracted || !typed) return false;
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalize(extracted) === normalize(typed);
  };

  const submitRegistration = async () => {
    if (!idFile) {
      setError("Protcol Error: ID Capture Required");
      return;
    }

    if (!idVerifiedRef.current) {
      setError("Protocol Error: Identity Verification Required");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("student_id", formData.student_id.trim());
      payload.append("name", formData.name.trim());
      payload.append("email", formData.email.trim());
      payload.append("id_image", idFile);

      await api.post("/students/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const loginForm = new FormData();
      loginForm.append("student_id", formData.student_id.trim());
      loginForm.append("email", formData.email.trim());
      const loginResponse = await api.post("/students/login", loginForm);
      localStorage.setItem("token", loginResponse.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Registry Synchronization Failure"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIdCheckMessage("");
    await submitRegistration();
  };

  const handleCheckId = async () => {
    setError("");
    setIdCheckMessage("");
    setIdCheckSuccess(false);
    idVerifiedRef.current = false;

    if (!idFile) {
      setError("Protocol Error: ID Capture Required");
      return;
    }

    if (!formData.student_id.trim()) {
      setError("Protocol Error: Identity Input Entry Empty");
      return;
    }

    setCheckingId(true);
    try {
      const extractedId = await extractStudentIdFromImage(idFile);
      const typedId = formData.student_id.trim().toLowerCase();

      // Use fuzzy matching: ignore punctuation/case differences from OCR
      const matches = fuzzyIdMatch(extractedId, typedId);

      if (matches) {
        // Use the typed ID (user-entered) as the canonical form
        const canonicalId = typedId;
        setIdCheckSuccess(true);
        idVerifiedRef.current = true;
        setIdCheckMessage("Identity Verified: Binary Match Confirmed.");
        setFormData((prev) => ({ ...prev, student_id: canonicalId }));
        const fieldsReady = formData.name.trim() && formData.email.trim();
        if (fieldsReady) {
          await submitRegistration();
        }
      } else {
        setIdCheckSuccess(false);
        const ocrHint = extractedId
          ? `OCR Read: "${extractedId}" — Ensure the ID card is clear and well-lit`
          : "ID number not found in image — Ensure the ID card is flat, well-lit, and the number is visible";
        setIdCheckMessage(`Verification Failure: ${ocrHint}`);
      }
    } catch (err) {
      setIdCheckSuccess(false);
      setIdCheckMessage("OCR Engine Failure: Unable to process archive.");
      console.error("OCR error:", err);
    } finally {
      setCheckingId(false);
    }
  };

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        setError("Hardware Exception: Camera Access Denied");
      }
    };

    if (useCamera) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraReady(false);
    };
  }, [useCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "student-id.png", { type: "image/png" });
      setIdFile(file);
    }, "image/png");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-600">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-indigo-500/[0.03] blur-[150px] rounded-full -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-violet-600/[0.02] blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

      <div className="astu-glass w-full max-w-2xl rounded-[4rem] border-2 border-[var(--glass-border)] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.15)] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-1000 bg-[var(--glass-bg)]/40 backdrop-blur-3xl px-10 py-14">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        
        <div className="text-center space-y-8 relative z-10">
          <div className="relative inline-block group">
             <div className="absolute -inset-6 bg-indigo-500/10 blur-2xl rounded-full animate-pulse" />
             <div className="relative h-16 w-16 mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-xl group-hover:rotate-6 transition-transform duration-700">
                <UserPlusIcon className="h-8 w-8" />
             </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-[var(--text-main)] uppercase tracking-tight leading-none">Identity Registry</h2>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider leading-none">Initialize New Node Partition</p>
          </div>
        </div>

        <form className="mt-12 space-y-10 relative z-10" onSubmit={handleRegister}>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[9px] font-semibold text-indigo-500 uppercase tracking-wider px-4 opacity-80">Sector 1: Primary Data</label>
                  <div className="space-y-6">
                    <input
                      name="student_id"
                      type="text"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-2xl px-6 py-4.5 text-xs font-semibold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)] tracking-wider uppercase"
                      placeholder="Student Hash (ugr/1234/12)"
                      value={formData.student_id}
                      onChange={handleChange}
                    />
                    <input
                      name="name"
                      type="text"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-2xl px-6 py-4.5 text-xs font-semibold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)]"
                      placeholder="Legal Designation (Full Name)"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-2xl px-6 py-4.5 text-xs font-semibold text-[var(--text-main)] focus:border-indigo-500/40 outline-none transition-all placeholder:text-[var(--text-muted)]"
                      placeholder="Transmission Address (Email)"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
               </div>

               <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="astu-btn-premium w-full py-5 rounded-2xl text-[10px] font-black text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-4 group active:scale-95 transition-all italic uppercase tracking-[0.4em]"
                  >
                    {loading ? "Synchronizing..." : "Initialize Registry"}
                  </button>
               </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] px-4 italic opacity-80">Sector 2: Verification</label>
                  <div className="astu-glass rounded-3xl border border-[var(--glass-border)] p-6 bg-[var(--bg-main)]/20 shadow-inner group">
                    <div className="flex items-center justify-between mb-6">
                       <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] italic">Identity Capture</p>
                       <div className="flex gap-2 p-1 rounded-lg bg-[var(--bg-main)]/40 border border-[var(--glass-border)]">
                          <button
                            type="button"
                            onClick={() => setUseCamera(false)}
                            className={`p-2 rounded-md transition-all ${!useCamera ? "bg-indigo-500 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-indigo-500"}`}
                          >
                            <CloudArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUseCamera(true)}
                            className={`p-2 rounded-md transition-all ${useCamera ? "bg-indigo-500 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-indigo-500"}`}
                          >
                            <CameraIcon className="h-4 w-4" />
                          </button>
                       </div>
                    </div>

                    <div className="relative min-h-[160px] rounded-2xl bg-[var(--bg-main)]/40 border-2 border-dashed border-[var(--glass-border)] flex flex-col items-center justify-center overflow-hidden">
                       {!useCamera ? (
                         <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
                            {idFile ? (
                              <div className="text-center group/file">
                                 <CheckBadgeIcon className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                                 <p className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest line-clamp-1 italic">{idFile.name}</p>
                                 <button type="button" onClick={() => setIdFile(null)} className="mt-2 text-[8px] font-black text-red-500 uppercase tracking-widest opacity-0 group-hover/file:opacity-100 transition-opacity">Deallocate</button>
                              </div>
                            ) : (
                               <>
                                <CloudArrowUpIcon className="h-8 w-8 text-indigo-500/20" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-[9px] font-black text-indigo-500/40 uppercase tracking-widest italic">Uplink Image Access</p>
                               </>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-4 w-full p-2">
                           <div className="relative rounded-xl overflow-hidden aspect-video bg-black/20 border border-[var(--glass-border)]">
                              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.2]" />
                              {!cameraReady && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" /></div>}
                           </div>
                           <canvas ref={canvasRef} className="hidden" />
                           <button
                             type="button"
                             onClick={handleCapture}
                             disabled={!cameraReady}
                             className="w-full py-3 rounded-xl bg-indigo-500 text-[9px] font-black text-white hover:bg-indigo-600 transition-all uppercase tracking-[0.3em] italic shadow-lg active:scale-95"
                           >
                             Capture Neural Hash
                           </button>
                         </div>
                       )}
                    </div>

                    <div className="mt-8">
                       <button
                         type="button"
                         onClick={handleCheckId}
                         disabled={checkingId}
                         className={`w-full py-4 rounded-xl border border-indigo-500/20 text-[9px] font-semibold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-3 ${checkingId ? "bg-indigo-500/10 text-indigo-500" : "bg-[var(--bg-main)]/60 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/40"}`}
                       >
                         {checkingId ? (<><div className="w-3 h-3 border border-indigo-500 border-t-transparent animate-spin rounded-full" /> Logic Check...</>) : "Execute Verification"}
                       </button>
                       {idCheckMessage && (
                         <div className={`mt-4 px-4 py-2.5 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500 ${idCheckSuccess ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"}`}>
                           {idCheckSuccess ? <CheckBadgeIcon className="h-4 w-4 shrink-0" /> : <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />}
                           <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed italic">{idCheckMessage}</p>
                         </div>
                       )}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-[10px] font-black text-center py-4 px-8 rounded-2xl bg-red-500/5 border border-red-500/20 uppercase tracking-[0.4em] italic shadow-xl animate-in zoom-in-95 duration-500">
               {error}
            </div>
          )}

          <div className="text-center pt-4">
             <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic opacity-60">Existing Entry Node?</span>{" "}
             <Link
               to="/"
               className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-all text-[11px] uppercase tracking-widest italic underline decoration-indigo-500/20 underline-offset-8 ml-2"
             >
               Sign In
             </Link>
          </div>
        </form>
      </div>

      {/* Decorative Protocol Branding */}
      <div className="absolute bottom-10 right-10 flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
        <div className="text-right">
           <p className="text-xs font-bold text-[var(--text-main)] leading-none uppercase tracking-tight">Archival Init V1.0</p>
           <p className="text-[8px] font-semibold text-indigo-500 uppercase tracking-wider mt-1 leading-none">Secure Uplink Verified</p>
        </div>
        <div className="h-0.5 w-12 bg-indigo-500/20" />
        <div className="h-10 w-10 rounded-xl border border-indigo-500/20 flex items-center justify-center shadow-inner">
           <ShieldCheckIcon className="h-6 w-6 text-indigo-500/40" />
        </div>
      </div>
    </div>
  );
}
