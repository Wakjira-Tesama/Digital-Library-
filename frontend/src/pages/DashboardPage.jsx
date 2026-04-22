import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  ComputerDesktopIcon,
  XMarkIcon,
  CheckBadgeIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

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
  { start: "19:00", end: "20:00", label: "7:00PM-8:00PM" },
  { start: "20:00", end: "21:00", label: "8:00PM-9:00PM" },
  { start: "21:00", end: "22:00", label: "9:00PM-10:00PM" },
  { start: "22:00", end: "23:00", label: "10:00PM-11:00PM" },
  { start: "23:00", end: "24:00", label: "11:00PM-12:00AM" },
];

export default function DashboardPage() {
  const [desktops, setDesktops] = useState([]);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [registerError, setRegisterError] = useState("");
  const [reportEntry, setReportEntry] = useState(null);
  const [reportCategory, setReportCategory] = useState("Password changed");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [lastEndedKey, setLastEndedKey] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingCancelEntry, setPendingCancelEntry] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const libId = localStorage.getItem("selectedLibraryId");
    if (!libId) {
      navigate("/library-selection");
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const [desktopsRes, userRes, scheduleRes] = await Promise.all([
        api.get("/desktops/overview", { params: { library_id: libId } }),
        api.get("/me"),
        api.get("/schedule", { params: { day: today, library_id: libId } }),
      ]);

      const desktopPayload = desktopsRes.data;
      const desktopList = Array.isArray(desktopPayload)
        ? desktopPayload
        : Array.isArray(desktopPayload?.desktops)
          ? desktopPayload.desktops
          : [];
      const normalizedDesktops = desktopList.map((desktop) => ({
        ...desktop,
        id: desktop.id || desktop._id,
      }));
      setDesktops(normalizedDesktops);
      setUser(userRes.data);

      const schedulePayload = scheduleRes.data;
      const scheduleList = Array.isArray(schedulePayload)
        ? schedulePayload
        : Array.isArray(schedulePayload?.schedule)
          ? schedulePayload.schedule
          : [];
      setScheduleEntries(scheduleList);

      // Check for active session
      try {
        const sessionRes = await api.get("/sessions/me", {
          params: { library_id: libId },
        });
        setActiveSession(sessionRes.data);
      } catch {
        setActiveSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(clock);
  }, []);

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setSelectedDesktop(null);
    setSelectedSlot(null);
    setRegisterError("");
  };

  const openReportModal = (entry) => {
    if (!entry) return;
    setReportEntry(entry);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportEntry(null);
    setReportError("");
    setReportSubmitting(false);
  };

  const showNotice = (message, type = "success") => {
    setNoticeMessage(message);
    setNoticeType(type);
  };

  const clearNotice = () => setNoticeMessage("");

  const openCancelModal = (entry) => {
    if (!entry) return;
    setPendingCancelEntry(entry);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setPendingCancelEntry(null);
  };

  const timeToMinutes = (value) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const isSlotExpired = (slot) => {
    if (!slot?.end) return false;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return nowMinutes > timeToMinutes(slot.end);
  };

  const isEntryExpired = (entry) => {
    if (!entry?.date || !entry?.end_time) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (entry.date < today) return true;
    if (entry.date > today) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= timeToMinutes(entry.end_time);
  };

  const timesOverlap = (startA, endA, startB, endB) => {
    return timeToMinutes(startA) < timeToMinutes(endB)
      ? timeToMinutes(startB) < timeToMinutes(endA)
      : false;
  };

  const handleRegisterClick = (desktop, slot) => {
    const studentId = user?.student_id?.toLowerCase();
    if (!studentId) return;
    const hasBooking = scheduleEntries.some(
      (entry) =>
        !isEntryExpired(entry) &&
        (entry.student_id || "").toLowerCase() === studentId,
    );
    const isSameSlotBooked = scheduleEntries.some(
      (entry) =>
        (entry.student_id || "").toLowerCase() === studentId &&
        entry.desktop_id === desktop.id &&
        entry.start_time === slot.start &&
        entry.end_time === slot.end,
    );

    if (hasBooking && !isSameSlotBooked) {
      setRegisterError("Existing booking detected. Please relinquish your current session to perform initialization on this node.");
      return;
    }
    
    // Check overlaps
    const hasOverlap = scheduleEntries.some((entry) => {
      if (isEntryExpired(entry)) return false;
      if ((entry.student_id || "").toLowerCase() !== studentId) return false;
      return timesOverlap(entry.start_time, entry.end_time, slot.start, slot.end);
    });

    if (hasOverlap) {
       setRegisterError("Temporal sync failure: Another sector is already reserved for this time cycle.");
       return;
    }

    setRegisterError("");
    setSelectedDesktop(desktop);
    setSelectedSlot(slot);
    setShowRegisterModal(true);
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!reportEntry) return;
    setReportSubmitting(true);
    setReportError("");
    try {
      await api.post("/issues/report", {
        desktop_id: reportEntry.desktop_id,
        library_id: localStorage.getItem("selectedLibraryId"),
        date: reportEntry.date,
        start_time: reportEntry.start_time,
        end_time: reportEntry.end_time,
        category: reportCategory,
        description: reportDescription || null,
      });
      closeReportModal();
      showNotice("Anomaly report transmitted successfully.");
    } catch (error) {
      setReportError(error.response?.data?.detail || "Signal transmission failed.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleCancelBooking = async (entry) => {
    if (!entry) return;
    closeCancelModal();
    setStartingSession(entry.desktop_id);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await api.post("/schedule/entry", {
        desktop_id: entry.desktop_id,
        date: entry.date || today,
        start_time: entry.start_time,
        end_time: entry.end_time,
        student_id: null,
        mark: null,
      });
      fetchData();
      showNotice("Reservation relinquished.");
    } catch (error) {
      const message = error.response?.data?.detail || "Termination sequence failed.";
      showNotice(message, "error");
    } finally {
      setStartingSession(null);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDesktop || !selectedSlot) return;
    setStartingSession(selectedDesktop.id);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const formData = new FormData();
      formData.append("desktop_id", String(selectedDesktop.id));
      formData.append("date", today);
      formData.append("start_time", selectedSlot.start);
      formData.append("end_time", selectedSlot.end);
      formData.append("student_id", user?.student_id || "");
      formData.append("name", user?.name || "");

      await api.post("/schedule/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closeRegisterModal();
      fetchData();
      showNotice("Node initialization successful.");
    } catch (error) {
      setRegisterError(error.response?.data?.detail || "Authentication sequence failed.");
    } finally {
      setStartingSession(null);
    }
  };

  const studentIdLower = user?.student_id?.toLowerCase();
  const bookingEntry = scheduleEntries.find(
    (entry) => (entry.student_id || "").toLowerCase() === studentIdLower,
  );

  useEffect(() => {
    if (!bookingEntry) return;
    if (!isEntryExpired(bookingEntry)) return;
    const entryKey = `${bookingEntry.desktop_id}-${bookingEntry.date}-${bookingEntry.start_time}-${bookingEntry.end_time}`;
    if (entryKey === lastEndedKey) return;
    showNotice("Your time has ended. Please release the terminal for others.", "error");
    setLastEndedKey(entryKey);
  }, [bookingEntry, lastEndedKey, currentTime]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)] transition-colors duration-600">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-600">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="astu-glass p-16 rounded-[4rem] border-2 border-[var(--glass-border)] max-w-xl w-full text-center space-y-10 relative z-10 shadow-2xl bg-[var(--glass-bg)]/40 backdrop-blur-3xl">
          <div className="relative inline-block group">
             <div className="absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full animate-pulse group-hover:bg-indigo-500/30 transition-all duration-700" />
             <div className="relative h-24 w-24 mx-auto bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <ComputerDesktopIcon className="h-10 w-10" />
             </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[var(--text-main)] uppercase tracking-tight leading-none">Active Environmental <br/> Initialization</h2>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed font-normal opacity-80">
              Your research session on <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-tight">Terminal #{activeSession.desktop_id}</span> is fully initialized and awaiting your command.
            </p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => navigate("/session")}
              className="astu-btn-premium px-16 py-6 rounded-2xl text-[11px] font-semibold uppercase tracking-wider text-white shadow-2xl shadow-indigo-500/30 w-full md:w-auto active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer"
            >
              Sign In To Terminal
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableCount = desktops.filter(d => d.status === "available").length;
  const busyCount = desktops.filter(d => d.status === "busy").length;
  const offlineCount = desktops.filter(d => d.status === "offline").length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-main)] transition-colors duration-600">
      <main className="flex-1 overflow-y-auto px-8 py-14 space-y-14 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-20">
          
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-12 astu-glass p-10 rounded-[3rem] border border-[var(--glass-border)] bg-[var(--glass-bg)]/20 shadow-2xl relative overflow-hidden backdrop-blur-3xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex flex-wrap gap-16 relative z-10">
              <div className="flex items-center gap-5 group/stat">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)] animate-pulse" />
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-3">Available</p>
                  <p className="text-3xl font-bold text-[var(--text-main)] leading-none group-hover/stat:text-emerald-500 transition-colors uppercase">{availableCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 group/stat">
                <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.9)]" />
                <div>
                  <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest leading-none mb-3">Reserved</p>
                  <p className="text-3xl font-bold text-[var(--text-main)] leading-none group-hover/stat:text-indigo-500 transition-colors uppercase">{busyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 group/stat">
                <div className="h-3 w-3 rounded-full bg-slate-400 opacity-50" />
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-3 opacity-60">Offline</p>
                  <p className="text-3xl font-bold text-[var(--text-main)] leading-none opacity-50 uppercase">{offlineCount}</p>
                </div>
              </div>
            </div>
            <div className="h-16 w-[1px] bg-[var(--glass-border)] hidden lg:block opacity-60" />
            <div className="text-right flex flex-col items-end gap-3 relative z-10">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] italic opacity-80 leading-none">Temporal Marker</p>
              <p className="text-lg font-black text-[var(--text-main)] tracking-tighter uppercase italic leading-none astu-title">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </section>

          {noticeMessage && (
            <div className={`px-10 py-6 rounded-[2.5rem] border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-6 duration-700 shadow-2xl relative overflow-hidden backdrop-blur-3xl ${
              noticeType === "success" 
                ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                : "bg-red-500/5 border-red-500/30 text-red-600 dark:text-red-400"
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
              <div className="flex items-center gap-5 relative z-10">
                <div className={`h-2.5 w-2.5 rounded-full ${noticeType === "success" ? "bg-emerald-500" : "bg-red-500"} shadow-[0_0_15px_currentColor] animate-pulse`} />
                <p className="text-xs font-black tracking-[0.1em] uppercase italic leading-none">{noticeMessage}</p>
              </div>
              <button onClick={clearNotice} className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-all italic h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--glass-border)] hover:bg-red-500/10 hover:text-red-500 relative z-10 cursor-pointer">x</button>
            </div>
          )}

          {bookingEntry && (
            <section className="astu-glass p-12 rounded-[3.5rem] border-2 border-indigo-500/30 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(99,102,241,0.2)] bg-indigo-500/[0.03] backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-sm animate-pulse">
                     <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                     <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] italic">Active Reservation Matrix</span>
                  </div>
                  <div>
                    <h2 className="text-5xl font-bold text-[var(--text-main)] uppercase tracking-tight leading-none">Terminal Sector #{bookingEntry.desktop_id}</h2>
                    <p className="text-[var(--text-muted)] text-lg font-normal mt-4 flex items-center gap-3">
                       Synchronization Window: <span className="text-indigo-600 dark:text-indigo-300 font-bold tracking-wider">{bookingEntry.start_time} - {bookingEntry.end_time}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <button onClick={() => openReportModal(bookingEntry)} className="px-10 py-5 rounded-2xl border border-[var(--glass-border)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-all uppercase tracking-wider bg-[var(--bg-main)]/50 shadow-md cursor-pointer">
                    Report Signal Loss
                  </button>
                  <button onClick={() => openCancelModal(bookingEntry)} className="px-12 py-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-wider shadow-2xl shadow-red-500/10 cursor-pointer">
                    Terminate Link
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-6">
              <div className="space-y-4 text-left">
                <h2 className="text-5xl font-bold text-[var(--text-main)] uppercase tracking-tight leading-none">Uplink Schedule</h2>
                <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider opacity-80">Activate a <span className="text-emerald-500 font-bold">Ready Node</span> to establish a terminal uplink cycle.</p>
              </div>
              <div className="flex flex-wrap items-center gap-10 bg-[var(--glass-bg)] dark:bg-[var(--glass-bg)]/20 backdrop-blur-3xl px-10 py-6 rounded-3xl border border-[var(--glass-border)] shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-4 group">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.3em] italic opacity-60">Ready</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.3em] italic opacity-60">Busy</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-slate-500 opacity-40" />
                    <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.3em] italic opacity-60">Offline</span>
                 </div>
              </div>
            </div>

            <div className="astu-glass rounded-[4rem] border border-[var(--glass-border)] overflow-hidden shadow-2xl bg-[var(--glass-bg)] dark:bg-[var(--glass-bg)]/20 backdrop-blur-3xl group">
              <div className="overflow-x-auto custom-scrollbar max-h-[70vh] scroll-smooth">
                {desktops.length > 0 ? (
                  <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
                    <thead className="sticky top-0 z-[60]">
                      <tr className="bg-[var(--bg-main)]/95 backdrop-blur-3xl">
                        <th className="px-14 py-12 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] sticky left-0 top-0 z-[70] bg-[var(--bg-main)] backdrop-blur-3xl border-r border-b border-[var(--glass-border)] shadow-2xl italic min-w-[220px]">
                          Temporal Window
                        </th>
                        {desktops.map((desktop) => (
                          <th key={desktop.id} className="px-10 py-12 text-center text-[11px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic group-hover:text-indigo-500 transition-colors border-b border-[var(--glass-border)]/20 min-w-[160px]">
                            Terminal {desktop.desktop_id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {TIME_SLOTS.map((slot) => (
                        <tr key={slot.start} className="hover:bg-indigo-500/[0.02] transition-all group relative">
                          <td className="px-14 py-10 text-[11px] font-black text-[var(--text-muted)] whitespace-nowrap sticky left-0 z-50 bg-[var(--bg-main)]/95 backdrop-blur-3xl group-hover:text-indigo-600 transition-all border-r border-[var(--glass-border)] shadow-xl uppercase italic tracking-[0.3em]">
                            {slot.label}
                          </td>
                          {desktops.map((desktop) => {
                            const entry = scheduleEntries.find(
                              (item) => item.desktop_id === desktop.id && item.start_time === slot.start && item.end_time === slot.end
                            );
                            const studentId = user?.student_id?.toLowerCase();
                            const bookedBy = entry?.student_id || "";
                            const isBooked = Boolean(bookedBy);
                            const isMine = studentId && bookedBy.toLowerCase() === studentId;
                            const isAvailable = desktop.status === "available" && !isBooked;
                            const canCancel = isMine;
                            const canRegister = isAvailable && !isSlotExpired(slot);
                            const isProcessing = startingSession === desktop.id && (canCancel || canRegister);

                            return (
                              <td key={`${desktop.id}-${slot.start}`} className="px-8 py-8 text-center">
                                <button
                                  onClick={() => {
                                    if (canCancel) { openCancelModal(entry); return; }
                                    if (canRegister) { handleRegisterClick(desktop, slot); }
                                  }}
                                  disabled={(!canRegister && !canCancel) || isProcessing}
                                  className={`w-full max-w-[150px] mx-auto py-5 rounded-2xl text-[9px] font-semibold uppercase tracking-wider transition-all duration-700 relative overflow-hidden cursor-pointer
                                    ${isMine 
                                      ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 scale-105" 
                                      : isAvailable && !isSlotExpired(slot)
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-110 active:scale-95 shadow-md"
                                        : isBooked || desktop.status === "busy"
                                          ? "bg-slate-200/50 dark:bg-slate-900/50 text-[var(--text-muted)] opacity-30 cursor-not-allowed grayscale scale-95"
                                          : "bg-transparent text-[var(--text-muted)] opacity-20 cursor-not-allowed grayscale-0"
                                    } ${isProcessing ? "animate-pulse" : ""}`}
                                >
                                  {isMine && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                                  {isProcessing ? "SYNC..." : isMine ? "LIVE" : isAvailable ? (isSlotExpired(slot) ? "END" : "READY") : isBooked ? "BUSY" : desktop.status.toUpperCase()}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-48 space-y-12 bg-transparent">
                    <div className="relative inline-block group">
                       <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 opacity-50 group-hover:opacity-80 transition-opacity" />
                       <div className="relative h-24 w-24 bg-indigo-500/5 rounded-3xl border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] opacity-30 shadow-inner group-hover:scale-110 transition-transform duration-700">
                          <ComputerDesktopIcon className="h-12 w-12" />
                       </div>
                    </div>
                    <div className="space-y-6">
                       <p className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">Cluster Sync Failure</p>
                       <p className="text-xl text-[var(--text-muted)] font-medium italic max-w-lg mx-auto opacity-70 leading-relaxed uppercase tracking-tighter">No active research terminals discovered within the local mesh.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {showRegisterModal && selectedDesktop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-[60px] animate-in fade-in duration-1000" onClick={closeRegisterModal} />
          <div className="astu-glass w-full max-w-2xl rounded-[4.5rem] border border-[var(--glass-border)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-700 bg-[var(--glass-bg)]/80 backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -mr-64 -mt-64 pointer-events-none animate-pulse" />
            <div className="flex items-center justify-between p-14 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/60 relative z-10">
              <div className="space-y-4 text-left">
                <h3 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">Uplink Authorization</h3>
                <p className="text-[var(--text-muted)] text-[11px] font-black italic uppercase tracking-[0.5em] opacity-80 flex items-center gap-4">
                   <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_indigo]" />
                   Establishing Link to <span className="text-indigo-600 dark:text-indigo-400 font-extrabold not-italic tracking-tighter">NODE_{selectedDesktop.desktop_id}</span>
                </p>
              </div>
              <button onClick={closeRegisterModal} className="h-16 w-16 flex items-center justify-center rounded-3xl bg-[var(--glass-border)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 hover:scale-110 transition-all active:scale-95 shadow-xl group cursor-pointer">
                <XMarkIcon className="h-7 w-7 stroke-[3] group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-14 lg:p-16 space-y-12 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] px-4 italic opacity-70">Identity Hash</label>
                  <div className="astu-glass bg-[var(--bg-main)]/90 border border-[var(--glass-border)] px-8 py-6 rounded-[2.2rem] text-[var(--text-main)] font-black tracking-[0.4em] text-xs uppercase shadow-inner italic border-l-4 border-l-indigo-600">
                    {user?.student_id || "NOT_READY"}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] px-4 italic opacity-70">Operator Name</label>
                  <div className="astu-glass bg-[var(--bg-main)]/90 border border-[var(--glass-border)] px-8 py-6 rounded-[2.2rem] text-[var(--text-main)] font-black tracking-[0.4em] text-xs uppercase shadow-inner italic border-l-4 border-l-indigo-600 font-extrabold">
                    {user?.name || "IDENTITY_HIDDEN"}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] px-4 italic opacity-70">Synchronization Cycle</label>
                 <div className="astu-glass bg-[var(--bg-main)] border-2 border-indigo-500/30 px-10 py-8 rounded-[2.5rem] text-indigo-700 dark:text-indigo-300 font-black tracking-[0.4em] text-base flex items-center justify-between shadow-2xl shadow-indigo-500/10 italic">
                    <div className="flex items-center gap-6">
                       <CheckBadgeIcon className="h-8 w-8 text-indigo-500" />
                       <span className="leading-none">{selectedSlot ? selectedSlot.label : "UNDEFINED"}</span>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                 </div>
              </div>
              {registerError && (
                <div className="px-10 py-6 rounded-[2.5rem] bg-red-500/5 border border-red-500/30 text-[10px] text-red-600 dark:text-red-400 font-black tracking-[0.4em] text-center uppercase italic shadow-2xl">
                  PROTOCOL ERROR: <span className="opacity-80 leading-relaxed uppercase">{registerError}</span>
                </div>
              )}
              <div className="pt-8 flex flex-col sm:flex-row items-center gap-8">
                <button type="button" onClick={closeRegisterModal} className="w-full sm:w-auto px-14 py-6 rounded-3xl border border-[var(--glass-border)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5 transition-all uppercase tracking-wider bg-transparent active:scale-95 cursor-pointer">
                  Dismiss
                </button>
                <button type="submit" disabled={startingSession === selectedDesktop.id} className="w-full sm:flex-1 astu-btn-premium py-7 rounded-[2.5rem] text-[11px] font-semibold uppercase tracking-wider text-white shadow-2xl shadow-indigo-500/40 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-5 group/submit cursor-pointer">
                  {startingSession === selectedDesktop.id ? "SYNCING..." : (<><RocketLaunchIcon className="h-5 w-5 group-hover:rotate-12 group-hover:scale-125 transition-transform" /> Initialize Uplink</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && reportEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-[60px] animate-in fade-in duration-1000" onClick={closeReportModal} />
          <div className="astu-glass w-full max-w-lg rounded-[4.5rem] border border-[var(--glass-border)] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-700 bg-[var(--glass-bg)]/80 backdrop-blur-3xl p-2">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none animate-pulse" />
            <div className="flex items-center justify-between p-12 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/60 relative z-10">
              <div className="space-y-4 text-left">
                <h3 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">Report Anomalies</h3>
                <p className="text-[var(--text-muted)] text-[11px] font-black italic uppercase tracking-[0.5em] opacity-80">Flagging Node Cluster <span className="text-amber-600 dark:text-amber-400 font-extrabold not-italic tracking-tighter">TERM_{reportEntry.desktop_id}</span></p>
              </div>
              <button onClick={closeReportModal} className="h-16 w-16 flex items-center justify-center rounded-3xl bg-[var(--glass-border)] text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 hover:scale-110 transition-all active:scale-95 shadow-xl group cursor-pointer">
                <XMarkIcon className="h-7 w-7 stroke-[3] group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="p-12 space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.5em] px-4 italic opacity-70">Anomaly Class</label>
                <select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="w-full bg-[var(--bg-main)]/90 border border-[var(--glass-border)] rounded-[2rem] px-10 py-6 text-xs text-[var(--text-main)] font-black tracking-[0.3em] outline-none focus:border-amber-500/40 transition-all cursor-pointer shadow-inner uppercase italic appearance-none">
                  <option value="Password changed">Credential Sequence failure</option>
                  <option value="Login failure">Terminal I/O timeout</option>
                  <option value="Hardware instability">Mechanical Malfunction</option>
                  <option value="Other">Unknown Protocol Exception</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.5em] px-4 italic opacity-70">Observation Logs</label>
                <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} rows={4} className="w-full bg-[var(--bg-main)]/90 border border-[var(--glass-border)] rounded-[2.5rem] px-10 py-8 text-sm text-[var(--text-main)] font-medium tracking-tight outline-none focus:border-amber-500/40 transition-all resize-none placeholder:text-[var(--text-muted)]/40 shadow-inner italic" placeholder="Transmit anomaly details..." />
              </div>
              {reportError && (
                <div className="px-10 py-6 rounded-[2.5rem] bg-red-500/5 border border-red-500/30 text-[10px] text-red-600 dark:text-red-400 font-black tracking-[0.4em] text-center uppercase italic">
                   TRANSMISSION ERROR: {reportError}
                </div>
              )}
              <div className="pt-8 flex items-center gap-8">
                <button type="button" onClick={closeReportModal} className="flex-1 px-12 py-6 rounded-3xl border border-[var(--glass-border)] text-[10px] font-black text-[var(--text-muted)] hover:text-amber-600 transition-all uppercase tracking-[0.5em] italic bg-transparent cursor-pointer">
                  Abort
                </button>
                <button type="submit" disabled={reportSubmitting} className="flex-[2] py-7 rounded-[2.5rem] bg-amber-500/10 border border-amber-600/30 text-[11px] font-black uppercase tracking-[0.6em] text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-all shadow-2xl active:scale-95 italic flex items-center justify-center gap-5 group cursor-pointer">
                  {reportSubmitting ? "TRANSMITTING..." : (<><GlobeAltIcon className="h-5 w-5 group-hover:animate-spin" /> Transmit Signal</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && pendingCancelEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-[40px] animate-in fade-in duration-1000" onClick={closeCancelModal} />
          <div className="astu-glass w-full max-w-md rounded-[5rem] border border-[var(--glass-border)] shadow-[0_50px_150px_-20px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden text-center p-16 space-y-12 animate-in zoom-in-95 duration-700 bg-[var(--glass-bg)]/80 backdrop-blur-3xl px-12">
            <div className="relative inline-block group">
               <div className="absolute -inset-12 bg-red-500/20 blur-[80px] rounded-full animate-pulse group-hover:bg-red-500/40 transition-all duration-700" />
               <div className="relative h-28 w-28 mx-auto rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_20px_40px_-10px_rgba(239,68,68,0.4)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                  <XMarkIcon className="h-14 w-14 stroke-[3]" />
               </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-4xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter leading-none italic">Decommission Link?</h3>
              <p className="text-[var(--text-muted)] text-[16px] font-medium leading-relaxed italic opacity-80 uppercase tracking-tighter px-4">
                Confirming termination will relinquish access to <span className="text-red-600 dark:text-red-400 font-black not-italic decoration-double">TERM_{pendingCancelEntry.desktop_id}</span> within the current timeline.
              </p>
            </div>
            <div className="pt-8 flex flex-col gap-6">
              <button onClick={() => handleCancelBooking(pendingCancelEntry)} className="w-full py-7 rounded-[2.5rem] bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.6em] dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/40 hover:bg-red-700 dark:hover:bg-red-500/30 transition-all shadow-2xl shadow-red-500/50 italic active:scale-95 cursor-pointer">
                Execute Termination
              </button>
              <button onClick={closeCancelModal} className="w-full py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.6em] text-[var(--text-muted)] hover:text-indigo-600 transition-all italic opacity-50 hover:opacity-100 cursor-pointer">
                Abort Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
