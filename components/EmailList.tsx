"use client";

import { useState } from "react";
import { Check, ClipboardList, Pencil, Reply, Star, X } from "lucide-react";
import { EmailSummary } from "@/lib/types";
import { api } from "@/lib/api";

const btnCls =
  "flex items-center justify-center rounded p-1 text-slate-light/50 hover:text-slate transition-colors disabled:opacity-30";

export default function EmailList({
  emails,
  onArchived,
}: {
  emails: EmailSummary[];
  onArchived: (id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [taskAddedId, setTaskAddedId] = useState<string | null>(null);

  async function handleArchive(id: string) {
    setBusyId(id);
    const response = await fetch(api(`/api/dashboard/emails/${id}/dismiss`), {
      method: "POST",
    });
    if (response.ok) onArchived(id);
    setBusyId(null);
  }

  async function handleCreateTask(email: EmailSummary) {
    setBusyId(email.id);
    const response = await fetch(api("/api/dashboard/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: email.subject,
        notes: `${email.summary}\n\n${email.link}`,
      }),
    });
    if (response.ok) setTaskAddedId(email.id);
    setBusyId(null);
  }

  return (
    <ul className="flex flex-col gap-3">
      {emails.map((email) => (
        <li key={email.id} className="flex gap-2 border-b border-gold/15 pb-3 last:border-0 last:pb-0">
          {/* Email content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {email.needsReply && <Pencil className="h-3.5 w-3.5 shrink-0 text-slate" />}
              <a
                href={email.link}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm text-slate hover:text-gold-light"
              >
                {email.subject}
              </a>
              <span className="shrink-0 text-xs font-heading tracking-wider text-gold truncate max-w-[30%]">
                {email.from.replace(/<.*>/, "").trim() || email.from}
              </span>
              {email.starred && <Star className="h-3.5 w-3.5 shrink-0 text-gold fill-gold" />}
            </div>
            <p className="mt-0.5 text-xs text-slate-light/70 line-clamp-2">
              {email.summary}
            </p>
          </div>

          {/* Action buttons — stacked column */}
          <div className="flex flex-col items-center justify-center gap-1 shrink-0">
            <a
              href={email.link}
              target="_blank"
              rel="noreferrer"
              className={btnCls}
              title="Reply in Gmail"
            >
              <Reply className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => handleCreateTask(email)}
              disabled={busyId === email.id || taskAddedId === email.id}
              className={btnCls}
              title="Create a task"
            >
              {taskAddedId === email.id
                ? <Check className="h-3.5 w-3.5" />
                : <ClipboardList className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => handleArchive(email.id)}
              disabled={busyId === email.id}
              className={btnCls}
              title="Remove from this list"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
