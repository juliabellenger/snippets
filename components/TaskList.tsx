"use client";

import { useState } from "react";
import { GoogleTask } from "@/lib/types";
import { api } from "@/lib/api";

function formatDue(due?: string): string | null {
  if (!due) return null;
  const date = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskList({
  tasks,
  onTaskAdded,
}: {
  tasks: GoogleTask[];
  onTaskAdded: (task: GoogleTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const response = await fetch(api("/api/dashboard/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), due: due || undefined }),
    });
    setSaving(false);
    if (response.ok) {
      onTaskAdded(await response.json());
      setTitle("");
      setDue("");
    }
  }

  return (
    <div>
      {tasks.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {tasks.map((task) => {
            const dueLabel = formatDue(task.due);
            return (
              <li
                key={task.id}
                className="flex items-baseline justify-between gap-2 text-sm"
              >
                <span className="text-slate">{task.title}</span>
                {dueLabel && (
                  <span
                    className={`shrink-0 font-heading text-xs tracking-wider ${
                      dueLabel === "overdue" ? "text-danger" : "text-gold"
                    }`}
                  >
                    {dueLabel}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-gold/30 bg-cream px-2 py-1.5 text-sm text-slate placeholder:text-slate-light/40 focus:outline-none focus:border-gold"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="rounded-lg border border-gold/30 bg-cream px-2 py-1.5 text-xs text-slate focus:outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-lg border border-gold bg-gold-faint px-3 py-1.5 font-heading text-xs tracking-wider text-slate hover:bg-gold-pale transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
