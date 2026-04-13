"use client";

import Link from "next/link";
import { Snippet } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SnippetCard({ snippet }: { snippet: Snippet }) {
  const preview =
    snippet.cleanText.length > 80
      ? snippet.cleanText.slice(0, 80) + "..."
      : snippet.cleanText;

  return (
    <Link
      href={`/snippet/${snippet.id}`}
      className="block rounded-sm border-[1.5px] border-gold/30 bg-cream-light p-4 hover:border-gold/60 transition-colors"
    >
      <p className="text-slate text-sm leading-relaxed">{preview}</p>
      {snippet.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {snippet.categories.map((cat) => (
            <span
              key={cat}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/category/${encodeURIComponent(cat)}`;
              }}
              className="font-heading text-xs tracking-wider text-gold hover:text-gold-light cursor-pointer transition-colors"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-slate-light/50 italic">
        {timeAgo(snippet.createdAt)}
      </p>
    </Link>
  );
}
