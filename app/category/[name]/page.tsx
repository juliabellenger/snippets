"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Snippet } from "@/lib/types";
import SnippetCard from "@/components/SnippetCard";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const categoryName = decodeURIComponent(name);
  const router = useRouter();
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    fetch("/api/snippets")
      .then((r) => r.json())
      .then((all: Snippet[]) =>
        setSnippets(all.filter((s) => s.categories.includes(categoryName)))
      );
  }, [categoryName]);

  return (
    <div className="px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 font-heading text-sm tracking-wider text-gold hover:text-gold-light transition-colors"
      >
        &larr; Back
      </button>

      <h1 className="text-xl mb-4">
        <span className="inline-block rounded-sm border border-gold/50 bg-gold-faint px-3 py-1 font-heading tracking-[0.15em] text-slate">
          {categoryName}
        </span>
      </h1>

      {snippets.length === 0 ? (
        <p className="text-center text-slate-light/50 text-sm mt-12 italic">
          No snippets in this category.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {snippets.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      )}
    </div>
  );
}
