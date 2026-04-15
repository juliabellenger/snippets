"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Snippet, CategorySummary } from "@/lib/types";
import { api } from "@/lib/api";
import SnippetCard from "@/components/SnippetCard";
import SnippetForm from "@/components/SnippetForm";

export default function Home() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formInitialText, setFormInitialText] = useState("");
  const [formInputType, setFormInputType] = useState<"typed" | "spoken">(
    "typed"
  );
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(
    null
  );

  const load = useCallback(() => {
    fetch(api("/api/snippets"))
      .then((r) => r.json())
      .then(setSnippets);
    fetch(api("/api/categories?summaries=true"))
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function createRecognition() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  }

  function startListening() {
    const recognition = createRecognition();
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = recognition;
    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setLiveTranscript(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscript("");
    };

    recognition.onend = () => {
      // Speech recognition stopped — open the form with what we got
      setIsListening(false);
      if (finalTranscript.trim()) {
        setFormInitialText(finalTranscript.trim());
        setFormInputType("spoken");
        setShowForm(true);
      }
      setLiveTranscript("");
    };

    recognition.start();
    setIsListening(true);
    setLiveTranscript("");
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }

  function openTypeForm() {
    setFormInitialText("");
    setFormInputType("typed");
    setShowForm(true);
  }

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
          onClick={isListening ? stopListening : startListening}
          className={`flex flex-col items-center justify-center gap-1 rounded-sm border-[1.5px] p-6 transition-colors ${
            isListening
              ? "border-danger bg-danger/10 text-danger"
              : "border-gold bg-cream-light text-slate hover:bg-gold-faint"
          }`}
        >
          <span className="text-2xl">{isListening ? "⏹" : "🎙"}</span>
          <span className="font-heading text-sm tracking-wider">
            {isListening ? "Stop" : "Speak"}
          </span>
        </button>
        <button
          onClick={openTypeForm}
          className="flex flex-col items-center justify-center gap-1 rounded-sm border-[1.5px] border-gold bg-cream-light p-6 text-slate hover:bg-gold-faint transition-colors"
        >
          <span className="text-2xl">🪶</span>
          <span className="font-heading text-sm tracking-wider">Type</span>
        </button>
      </div>

      {/* Live transcript while speaking */}
      {isListening && (
        <div className="mb-8 rounded-sm border-[1.5px] border-danger/30 bg-cream-light p-4">
          <p className="font-heading text-xs tracking-[0.2em] text-danger uppercase mb-2">
            Listening...
          </p>
          <p className="text-slate text-sm leading-relaxed italic">
            {liveTranscript || "Start speaking..."}
          </p>
        </div>
      )}

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
          No snippets yet. Tap Type or Speak to create your first one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {snippets.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <SnippetForm
          initialText={formInitialText}
          inputType={formInputType}
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
