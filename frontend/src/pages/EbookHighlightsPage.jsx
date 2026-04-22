import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function EbookHighlightsPage() {
  const [ebooks, setEbooks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [selectedEbookId, setSelectedEbookId] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const libId = localStorage.getItem("selectedLibraryId");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ebooksRes, highlightsRes] = await Promise.all([
        api.get("/api/ebooks", { params: { library_id: libId } }),
        api.get("/api/ebook-user/highlights"),
      ]);
      setEbooks(ebooksRes.data || []);
      setHighlights(highlightsRes.data || []);
    } catch (err) {
      console.error("Failed to load highlights data", err);
      setError("Failed to load highlights.");
    } finally {
      setLoading(false);
    }
  }, [libId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedEbookId || !text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/api/ebook-user/highlights", {
        ebook_id: selectedEbookId,
        text,
      });
      setHighlights((prev) => [res.data, ...prev]);
      setText("");
    } catch (err) {
      console.error("Failed to save highlight", err);
      setError("Failed to save highlight.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/ebook-user/highlights/${id}`);
      setHighlights((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error("Failed to delete highlight", err);
      setError("Failed to delete highlight.");
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
          <PencilSquareIcon className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-sm font-semibold">Saved Highlights</h2>
            <p className="text-[11px] text-slate-400">
              Store important quotes or notes from your ebooks.
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-4 overflow-auto space-y-4">
        {error && (
          <div className="mb-2 bg-red-500/10 border border-red-500/40 text-red-200 text-xs px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-slate-800/70 border border-white/5 rounded-2xl p-4 space-y-2 text-xs"
        >
          <div className="flex gap-2">
            <select
              value={selectedEbookId}
              onChange={(e) => setSelectedEbookId(e.target.value)}
              className="w-1/3 bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="">Select ebook</option>
              {ebooks.map((ebook) => (
                <option
                  key={ebook._id || ebook.id}
                  value={ebook._id || ebook.id}
                >
                  {ebook.title}
                </option>
              ))}
            </select>
            <textarea
              rows={2}
              placeholder="Write your highlight or note here..."
              className="flex-1 bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/60 resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-slate-900 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Highlight"}
            </button>
          </div>
        </form>

        <section className="space-y-2">
          {highlights.length === 0 ? (
            <p className="text-sm text-slate-400">
              You have no saved highlights yet.
            </p>
          ) : (
            highlights.map((h) => (
              <article
                key={h._id}
                className="bg-slate-800/70 border border-white/5 rounded-2xl p-3 text-xs flex justify-between gap-3"
              >
                <div>
                  <p className="text-slate-100 whitespace-pre-wrap">{h.text}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {h.ebook?.title
                      ? `From: ${h.ebook.title}`
                      : "Unknown ebook"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(h._id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-900/70 hover:bg-red-600/70 text-red-200"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
