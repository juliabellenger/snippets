import fs from "fs";
import path from "path";
import { Snippet, CategorySummary } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "snippets.json");

function readAll(): Snippet[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(snippets: Snippet[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(snippets, null, 2));
}

export function listSnippets(): Snippet[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSnippet(id: string): Snippet | undefined {
  return readAll().find((s) => s.id === id);
}

export function createSnippet(
  cleanText: string,
  categories: string[]
): Snippet {
  const snippets = readAll();
  const now = new Date().toISOString();
  const snippet: Snippet = {
    id: crypto.randomUUID(),
    cleanText,
    inputType: "typed",
    categories,
    createdAt: now,
    updatedAt: now,
  };
  snippets.push(snippet);
  writeAll(snippets);
  return snippet;
}

export function updateSnippet(
  id: string,
  updates: Partial<Pick<Snippet, "cleanText" | "categories">>
): Snippet | null {
  const snippets = readAll();
  const idx = snippets.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  if (updates.cleanText !== undefined) snippets[idx].cleanText = updates.cleanText;
  if (updates.categories !== undefined) snippets[idx].categories = updates.categories;
  snippets[idx].updatedAt = new Date().toISOString();
  writeAll(snippets);
  return snippets[idx];
}

export function deleteSnippet(id: string): boolean {
  const snippets = readAll();
  const filtered = snippets.filter((s) => s.id !== id);
  if (filtered.length === snippets.length) return false;
  writeAll(filtered);
  return true;
}

export function listCategories(): string[] {
  const snippets = listSnippets(); // already sorted newest first
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of snippets) {
    for (const cat of s.categories) {
      if (!seen.has(cat)) {
        seen.add(cat);
        result.push(cat);
      }
    }
  }
  return result;
}

export function listCategorySummaries(): CategorySummary[] {
  const snippets = listSnippets(); // newest first
  const map = new Map<string, { count: number; lastUsed: string }>();
  for (const s of snippets) {
    for (const cat of s.categories) {
      const existing = map.get(cat);
      if (!existing) {
        map.set(cat, { count: 1, lastUsed: s.createdAt });
      } else {
        existing.count++;
      }
    }
  }
  return Array.from(map.entries())
    .map(([name, { count, lastUsed }]) => ({ name, count, lastUsed }))
    .sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
}
