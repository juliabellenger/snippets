"use client";

import { useState, useEffect, useRef } from "react";

interface CategoryInputProps {
  value: string[];
  onChange: (categories: string[]) => void;
}

export default function CategoryInput({ value, onChange }: CategoryInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const allCategoriesRef = useRef<string[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((categories) => {
        allCategoriesRef.current = categories;
      });
  }, []);

  function addCategory(cat: string) {
    const trimmed = cat.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  }

  function removeCategory(cat: string) {
    onChange(value.filter((c) => c !== cat));
  }

  function handleInputChange(text: string) {
    setInput(text);
    if (text.trim()) {
      const filtered = allCategoriesRef.current.filter(
        (c) => c.includes(text.toLowerCase()) && !value.includes(c)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 rounded-sm border border-gold/40 bg-gold-faint px-2 py-0.5 font-heading text-xs tracking-wider text-slate"
          >
            {cat}
            <button
              type="button"
              onClick={() => removeCategory(cat)}
              className="text-gold hover:text-danger ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCategory(input);
            }
          }}
          placeholder="Add a category..."
          className="w-full rounded-sm border-[1.5px] border-gold/30 bg-cream px-3 py-2 text-sm text-slate placeholder:text-slate-light/40 focus:border-gold focus:outline-none"
        />
        {showSuggestions && (
          <ul className="absolute z-10 mt-1 w-full rounded-sm border border-gold/40 bg-cream-light shadow-lg">
            {suggestions.map((s) => (
              <li
                key={s}
                onClick={() => addCategory(s)}
                className="cursor-pointer px-3 py-2 text-sm text-slate hover:bg-gold-faint"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
