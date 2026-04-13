"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Snippet, CategorySummary } from "@/lib/types";
import SnippetCard from "@/components/SnippetCard";
import SnippetForm from "@/components/SnippetForm";

export default function Home() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    fetch("/api/snippets")
      .then((r) => r.json())
      .then(setSnippets);
    fetch("/api/categories?summaries=true")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl tracking-[0.15em] text-slate">
          Snippets
        </h1>
        <p className="font-script text-2xl text-gold mt-1">
          save the moments forever
        </p>
        <div className="mt-4 mx-auto w-48 border-t border-gold/40" />
      </div>

      {/* Capture buttons */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          disabled
          className="flex flex-col items-center justify-center gap-1 rounded-sm border-[1.5px] border-dashed border-slate/20 bg-cream-light p-6 text-slate-light/40 cursor-not-allowed"
        >
          <span className="text-2xl">🎙</span>
          <span className="font-heading text-sm tracking-wider">Record</span>
          <span className="font-body text-xs italic">Coming soon</span>
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-sm border-[1.5px] border-gold bg-cream-light p-6 text-slate hover:bg-gold-faint transition-colors"
        >
          <span className="text-2xl">🪶</span>
          <span className="font-heading text-sm tracking-wider">Type</span>
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-xs tracking-[0.2em] text-slate-light uppercase mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/category/${encodeURIComponent(cat.name)}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold/50 bg-cream-light px-3 py-1.5 font-heading text-sm tracking-wider text-slate hover:bg-gold-faint transition-colors"
              >
                {cat.name}
                <span className="text-xs text-gold font-body">
                  {cat.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Snippet feed */}
      {snippets.length === 0 ? (
        <p className="text-center text-slate-light/60 text-sm mt-12 italic">
          No snippets yet. Tap Type to create your first one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {snippets.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      )}

      {/* Type modal */}
      {showForm && (
        <SnippetForm
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
