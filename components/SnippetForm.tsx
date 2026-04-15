"use client";

import { useState } from "react";
import CategoryInput from "./CategoryInput";
import { api } from "@/lib/api";

interface SnippetFormProps {
  onSaved: () => void;
  onCancel: () => void;
  initialText?: string;
  inputType?: "typed" | "spoken";
}

export default function SnippetForm({
  onSaved,
  onCancel,
  initialText = "",
  inputType = "typed",
}: SnippetFormProps) {
  const [text, setText] = useState(initialText);
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await fetch(api("/api/snippets"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanText: text, categories, inputType }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate/40">
      <div className="w-full max-w-lg rounded-t-lg sm:rounded-lg bg-cream-light p-6 shadow-xl border-t-[1.5px] sm:border-[1.5px] border-gold">
        <h2 className="font-heading text-xl tracking-[0.15em] text-slate mb-4">
          New Snippet
        </h2>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your snippet..."
          rows={5}
          className="w-full rounded-sm border-[1.5px] border-gold/30 bg-cream px-3 py-2 text-sm text-slate placeholder:text-slate-light/40 focus:border-gold focus:outline-none resize-none"
        />
        <div className="mt-3">
          <CategoryInput value={categories} onChange={setCategories} />
        </div>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-sm border border-gold/40 bg-transparent px-4 py-2 font-heading text-sm tracking-wider text-slate hover:bg-gold-faint transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="rounded-sm bg-slate px-4 py-2 font-heading text-sm tracking-wider text-cream-light hover:bg-slate-light disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
