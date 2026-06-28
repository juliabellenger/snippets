"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { GoogleTask } from "@/lib/types";

export default function NewTaskForm({
  onCreated,
}: {
  onCreated: (task: GoogleTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch(api("/api/dashboard/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), due: due || undefined }),
    });
    if (res.ok) {
      const task: GoogleTask = await res.json();
      onCreated(task);
      setTitle("");
      setDue("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        placeholder="New task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 min-w-0 bg-transparent border-b border-gold/30 py-1 text-sm text-slate placeholder:text-slate-light/40 focus:outline-none focus:border-gold"
      />
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="shrink-0 bg-transparent border-b border-gold/30 py-1 text-xs text-slate-light/70 focus:outline-none focus:border-gold w-32"
      />
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="shrink-0 h-7 w-7 flex items-center justify-center rounded border border-gold/30 text-slate-light/60 hover:text-gold hover:border-gold transition-colors disabled:opacity-30"
        aria-label="Save task"
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </button>
    </form>
  );
}
