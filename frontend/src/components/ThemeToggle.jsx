import React, { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleToggle = () => {
    if (window.toggleAstuTheme) {
      window.toggleAstuTheme();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="astu-glass p-2.5 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-all active:scale-95 group relative overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center justify-center w-6 h-6">
        {isDark ? (
          <SunIcon className="w-5 h-5 text-amber-400 transform group-hover:rotate-45 transition-transform duration-500" />
        ) : (
          <MoonIcon className="w-5 h-5 text-indigo-600 transform group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </div>
    </button>
  );
}
