import React, { useState, useEffect, useRef } from "react";
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  SparklesIcon, 
  UserCircleIcon,
  AcademicCapIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  ComputerDesktopIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import api from "../api";

export default function AIScholarDrawer({ isOpen, onClose, embedded = false }) {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hello! I am your ASTU Digital AI Scholar. How can I help you with your studies or finding books today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Diagnostic Check
    const checkStatus = async () => {
      try {
        const res = await api.get("/api/ai/ping");
        if (!res.data.hasApiKey) {
           setMessages(prev => [...prev, { 
             role: "assistant", 
             content: "⚠️ DIAGNOSTIC: The Scholar Core is online, but the Gemini API Key is missing from the server environment. Please ask the administrator to verify the .env configuration." 
           }]);
        }
      } catch (err) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "❌ CONNECTIVITY ERROR: I cannot reach the Research Matrix. Please ensure the backend server is running and the network route to /api/ai is open." 
        }]);
      }
    };

    if (isOpen || embedded) {
      checkStatus();
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen, embedded]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/ai/chat", {
        message: input,
        history: messages.slice(1) // Send history excluding the first welcome message
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: response.data.content }]);
    } catch (err) {
      console.error("AI Scholar Error:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I encountered a synchronization error. Please ensure your AI configuration is active and try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReserve = async (slotId, terminal, time) => {
    try {
      // Fetch user profile to get student_id/name if needed, or assume backend gets it from req.user
      await api.post("/schedule/register", {
        desktop_id: slotId, // Backend expects desktop_id as the ID or similar
        date: new Date().toISOString().split('T')[0],
        start_time: time.split(" - ")[0],
        end_time: time.split(" - ")[1]
      });
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Study Uplink Established! I have reserved ${terminal} for you from ${time}. Enjoy your focus session!` 
      }]);
    } catch (err) {
      console.error("Booking Error:", err);
      alert("Failed to establish uplink. The slot might have been taken.");
    }
  };

  const renderMessageContent = (msg) => {
    const slotMatch = msg.content.match(/\[SLOT_SUGGESTION: (.*?)\]/);
    const cleanContent = msg.content.replace(/\[SLOT_SUGGESTION: .*?\]/, "").trim();

    return (
      <div className="space-y-4">
        <p>{cleanContent}</p>
        {slotMatch && (
          <div className="mt-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <InformationCircleIcon className="h-6 w-6 text-white" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Recommended Uplink</h4>
                  <p className="text-[13px] font-bold text-[var(--text-main)] italic">Fast-Track Reservation Available</p>
               </div>
            </div>
            
            {(() => {
              try {
                const slotData = JSON.parse(slotMatch[1]);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--text-muted)]">
                       <span className="flex items-center gap-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-indigo-500" />
                          {slotData.terminal}
                       </span>
                       <span className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-indigo-500" />
                          {slotData.time}
                       </span>
                    </div>
                    <button 
                      onClick={() => handleQuickReserve(slotData.slotId, slotData.terminal, slotData.time)}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all italic"
                    >
                      Confirm Study Uplink
                    </button>
                  </div>
                );
              } catch (e) {
                return <p className="text-[10px] text-red-500 italic">Error parsing slot data</p>;
              }
            })()}
          </div>
        )}
      </div>
    );
  };

  const suggestions = [
    "Most readable Chemistry books?",
    "Best books for beginners?",
    "Recommend a book on Research Methods.",
    "Top rated books overall?"
  ];

  if (embedded) {
    return (
      <div className="h-full w-full bg-[var(--bg-main)]/50 backdrop-blur-3xl flex flex-col relative overflow-hidden">
        {/* Header - Simplified for embedded view */}
        <div className="px-10 py-10 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--bg-main)]/95 shadow-sm">
          <div className="flex items-center gap-5">
             <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                <SparklesIcon className="h-7 w-7 text-white animate-pulse" />
             </div>
             <div>
               <h3 className="text-2xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">Research Intelligence</h3>
               <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3 opacity-80 italic">Uplinked to Library Matrix</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Core Active</span>
             </div>
          </div>
        </div>

        {/* Chat Pane */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="mt-2 flex-shrink-0">
                {msg.role === "user" ? (
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-indigo-500" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <AcademicCapIcon className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              <div className={`max-w-[70%] space-y-3`}>
                 <div 
                  className={`px-8 py-5 rounded-[2.5rem] text-[15px] font-medium leading-relaxed
                    ${msg.role === "user" 
                      ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30" 
                      : "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-main)] shadow-xl"}`}
                 >
                   {renderMessageContent(msg)}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 px-3 italic">
                   {msg.role === "user" ? "Authorized Student" : "AI Scholar Core"}
                 </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-6">
              <div className="mt-2 h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-emerald-500 animate-bounce" />
              </div>
              <div className="astu-glass px-8 py-5 rounded-[2.5rem] flex gap-3 items-center shadow-2xl bg-[var(--glass-bg)]/50">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-10 space-y-8 bg-[var(--bg-main)]/95 border-t border-[var(--glass-border)]">
          {/* Suggestions - Desktop specific */}
          {!isLoading && messages.length <= 2 && (
            <div className="flex flex-wrap gap-4 max-w-4xl mx-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="px-6 py-3 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-all active:scale-95 italic"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the scholar terminal..."
              className="w-full bg-[var(--bg-main)] border-2 border-[var(--glass-border)] rounded-[2.5rem] px-10 py-7 pr-24 text-base focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_40px_rgba(79,70,229,0.15)] transition-all placeholder:opacity-40 font-semibold shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
            >
              <PaperAirplaneIcon className="h-6 w-6 -rotate-45" />
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 opacity-30">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--text-muted)]" />
             <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em] italic whitespace-nowrap">Scholar Matrix Link Active</p>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-500"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] z-[110] transition-transform duration-700 ease-in-out transform shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full bg-[var(--bg-main)]/95 backdrop-blur-3xl border-l border-[var(--glass-border)] flex flex-col relative overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-10 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/50">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                  <SparklesIcon className="h-6 w-6 text-white animate-pulse" />
               </div>
               <div>
                 <h3 className="text-xl font-black text-[var(--text-main)] astu-title uppercase tracking-tighter italic leading-none">AI Scholar</h3>
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2 opacity-80 italic">Predictive Analytics Mode</p>
               </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl hover:bg-slate-500/10 transition-colors text-[var(--text-muted)]"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Chat Pane */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`mt-1 flex-shrink-0`}>
                  {msg.role === "user" ? (
                    <UserCircleIcon className="h-8 w-8 text-indigo-500 opacity-60" />
                  ) : (
                    <AcademicCapIcon className="h-8 w-8 text-emerald-500 opacity-80" />
                  )}
                </div>
                <div className={`max-w-[80%] space-y-2`}>
                   <div 
                    className={`px-6 py-4 rounded-3xl text-[13px] font-medium leading-relaxed
                      ${msg.role === "user" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                        : "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-main)] shadow-sm"}`}
                   >
                   {renderMessageContent(msg)}
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40 px-2 italic">
                     {msg.role === "user" ? "Student" : "ASTU Scholar"}
                   </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="mt-1">
                  <AcademicCapIcon className="h-8 w-8 text-emerald-500 opacity-80 animate-bounce" />
                </div>
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] px-6 py-4 rounded-3xl flex gap-2 items-center shadow-inner">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 space-y-6 bg-[var(--glass-bg)]/50 border-t border-[var(--glass-border)]">
            
            {/* Suggestions */}
            {!isLoading && messages.length <= 2 && (
              <div className="flex flex-wrap gap-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-all active:scale-95 italic"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative group">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Scholar about Chemistry, Math..."
                className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl px-6 py-5 pr-16 text-sm focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all placeholder:opacity-50 font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:scale-110 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
              >
                <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
              </button>
            </form>
            <p className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest justify-center italic">
              <InformationCircleIcon className="h-4 w-4" />
              Connected with Local Library Matrix 0.1
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
