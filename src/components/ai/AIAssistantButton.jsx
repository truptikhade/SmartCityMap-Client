"use client";
import { Bot, X } from "lucide-react";

export default function AIAssistantButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      title={open ? "Close AI assistant" : "Open AI assistant"}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-mauve-800 bg-mauve-700 px-4 text-white shadow-lg shadow-mauve-950/20 transition hover:bg-mauve-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-400 focus-visible:ring-offset-2"
    >
      {open ? <X size={19} /> : <Bot size={19} />}
      <span className="text-sm font-medium">{open ? "Close" : "Ask AI"}</span>
    </button>
  );
}
