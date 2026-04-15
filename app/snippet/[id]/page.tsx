"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Snippet } from "@/lib/types";
import { api } from "@/lib/api";
import CategoryInput from "@/components/CategoryInput";

export default function SnippetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(api(`/api/snippets/${id}`))
      .then((r) => r.json())
      .then((data) => {
        setSnippet(data);
        setCategories(data.categories);
      });
  }, [id]);

  async function saveCategories(newCategories: string[]) {
    setCategories(newCategories);
    setSaving(true);
    const updated = await fetch(api(`/api/snippets/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: newCategories }),
    }).then((r) => r.json());
    setSnippet(updated);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this snippet?")) return;
    await fetch(api(`/api/snippets/${id}`), { method: "DELETE" });
    router.push("/");
  }

  if (!snippet) {
    return (
      <div className="px-4 py-8 text-slate-light/50 italic">Loading...</div>
    );
  }

  return (
    <div className="px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 font-heading text-sm tracking-wider text-gold hover:text-gold-light transition-colors"
      >
        &larr; Back
      </button>

      <div className="rounded-lg border-[1.5px] border-gold/30 bg-cream-light p-5">
        <p className="text-slate leading-relaxed whitespace-pre-wrap">
          {snippet.cleanText}
        </p>

        <div className="mt-5 border-t border-gold/20 pt-4">
          <label className="font-heading text-xs tracking-[0.2em] text-slate-light uppercase">
            Categories{" "}
            {saving && (
              <span className="text-gold italic font-body">(saving...)</span>
            )}
          </label>
          <div className="mt-2">
            <CategoryInput value={categories} onChange={saveCategories} />
          </div>
        </div>

        <div className="mt-5 flex justify-between items-center border-t border-gold/20 pt-4">
          <span className="text-xs text-slate-light/50 italic">
            {new Date(snippet.createdAt).toLocaleString()}
          </span>
          <button
            onClick={handleDelete}
            className="font-heading text-sm tracking-wider text-danger hover:text-danger-light transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
