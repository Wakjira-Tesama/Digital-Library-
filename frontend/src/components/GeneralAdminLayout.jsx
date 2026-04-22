import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheckIcon,
  Squares2X2Icon,
  BuildingLibraryIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export default function GeneralAdminLayout({
  user,
  children,
  searchPlaceholder = "Search libraries, members, or settings...",
}) {
  const location = useLocation();

  const avatarInitial = (user?.name || user?.email || "A")
    .charAt(0)
    .toUpperCase();

  const navItems = [
    {
      label: "Dashboard",
      to: "/general-admin-dashboard",
      icon: Squares2X2Icon,
    },
    {
      label: "Library Nodes",
      to: "/general-admin-library-nodes",
      icon: BuildingLibraryIcon,
    },
    {
      label: "Announcements",
      to: "/general-admin-announcements",
      icon: MegaphoneIcon,
    },
    {
      label: "Desktop Pool",
      to: "/desktop-pool",
      icon: ComputerDesktopIcon,
    },
    {
      label: "Chat",
      to: "/admin-chat",
      icon: ChatBubbleLeftRightIcon,
    },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors duration-500">
      {/* Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 z-50 p-6 hidden lg:block">
        <div className="h-full astu-glass rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col overflow-hidden shadow-2xl bg-[var(--glass-bg)]/80 backdrop-blur-2xl">
          <div className="px-8 pt-10 pb-8">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] leading-tight">
                  ASTU Super
                </p>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1 italic">
                  Central Uplink
                </p>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent opacity-50" />

          <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 active:scale-95
                    ${active 
                      ? "bg-rose-500 dark:bg-rose-500 text-white dark:text-white shadow-[0_15px_30px_-5px_rgba(244,63,94,0.3)] dark:shadow-xl dark:shadow-rose-500/20" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-rose-500/5 hover:text-rose-500"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-rose-500"}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto">
            <div className="astu-glass rounded-2xl p-4 border border-rose-500/10 bg-rose-500/5">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tighter">System Nominal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen transition-all duration-500 px-6 sm:px-10 py-10">
        <div className="max-w-[1700px] mx-auto space-y-10">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative flex-1 max-w-2xl w-full group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-xl pl-16 pr-8 py-4 text-xs font-bold italic text-[var(--text-main)] placeholder:text-[var(--text-muted)] shadow-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all duration-500"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Security Level</span>
                <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                  ALPHA CLEARANCE
                </span>
              </div>

              <div className="h-px w-8 bg-[var(--glass-border)] rotate-90 hidden sm:block" />

              <button
                type="button"
                className="relative group p-3 rounded-2xl astu-glass border border-[var(--glass-border)] hover:border-rose-500/30 transition-all duration-500 shadow-lg"
                aria-label="Notifications"
              >
                <BellIcon className="h-6 w-6 text-[var(--text-muted)] group-hover:text-rose-500" />
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-lg shadow-xl shadow-rose-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500 ring-4 ring-rose-500/10 cursor-pointer">
                  {avatarInitial}
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {children}
          </div>
        </div>
      </main>

      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
