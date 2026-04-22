import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { BookOpenIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function EbookShelfPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShelf = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/ebook-user/shelf");
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load shelf", err);
      setError("Failed to load your shelf.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  const handleOpen = async (ebook) => {
    try {
      await api.post(`/api/ebooks/${ebook._id || ebook.id}/popularity`);
      await api.post("/api/ebook-user/progress", {
        ebook_id: ebook._id || ebook.id,
      });
    } catch (err) {
      console.warn("Failed to record open", err);
    }
    const url = ebook.fileUrl || ebook.externalLink;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleRemove = async (ebookId) => {
    try {
      await api.delete(`/api/ebook-user/shelf/${ebookId}`);
      setItems((prev) =>
        prev.filter((i) => (i.ebook?._id || i.ebook?.id) !== ebookId),
      );
    } catch (err) {
      console.error("Failed to remove from shelf", err);
      setError("Failed to remove from shelf.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <header className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold">My Shelf</h2>
            <p className="text-[11px] text-slate-400">
              Books you saved to read later.
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-4 overflow-auto">
        {error && (
          <div className="mb-3 bg-red-500/10 border border-red-500/40 text-red-200 text-xs px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">
            You have no books on your shelf yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const ebook = item.ebook || {};
              const ebookId = ebook._id || ebook.id;
              return (
                <li
                  key={item._id}
                  className="bg-slate-800/70 border border-white/5 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-28 mb-2 rounded-lg bg-gradient-to-br from-emerald-500/60 to-blue-600/60 flex items-end px-3 pb-2 text-xs font-semibold text-white">
                      <span className="truncate w-full">
                        {ebook.title || "Untitled"}
                      </span>
                    </div>
                    {ebook.author && (
                      <p className="text-[11px] text-slate-300 mb-1 truncate">
                        {ebook.author}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {ebook.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(ebook)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-slate-900"
                    >
                      Read
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(ebookId)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
