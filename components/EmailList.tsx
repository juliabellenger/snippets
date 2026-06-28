"use client";

import { useState } from "react";
import { EmailSummary } from "@/lib/types";
import { api } from "@/lib/api";

export default function EmailList({
  emails,
  onArchived,
}: {
  emails: EmailSummary[];
  onArchived: (id: string) => void;
}) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(id: string) {
    setArchivingId(id);
    const response = await fetch(api(`/api/dashboard/emails/${id}/archive`), {
      method: "POST",
    });
    if (response.ok) {
      onArchived(id);
    }
    setArchivingId(null);
  }

  return (
    <ul className="flex flex-col gap-2">
      {emails.map((email) => (
        <li key={email.id} className="flex items-start gap-2">
          <a
            href={email.link}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-0 block"
          >
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={email.unread ? "text-slate font-semibold" : "text-slate"}>
                {email.from.split("<")[0].trim()}
              </span>
              {email.starred && <span className="text-gold">★</span>}
            </div>
            <p className="text-slate-light/70 text-xs truncate">
              {email.subject}
            </p>
          </a>
          <button
            onClick={() => handleArchive(email.id)}
            disabled={archivingId === email.id}
            className="shrink-0 rounded-lg border border-gold/30 px-2 py-1 font-heading text-xs tracking-wider text-slate-light/70 hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
          >
            {archivingId === email.id ? "..." : "Archive"}
          </button>
        </li>
      ))}
    </ul>
  );
}
