import React, { useState } from "react";
import { X, FileText } from "lucide-react";
import type { DocumentCategory } from "@freewrite/core";
import { useDocumentStore } from "../../stores/documentStore";

interface NewDocumentDialogProps {
  onClose: () => void;
}

export function NewDocumentDialog({ onClose }: NewDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("gdd");
  const createDocument = useDocumentStore((s) => s.createDocument);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createDocument(title, category);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-96 bg-fw-panel border border-fw-border rounded shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-fw-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-fw-text uppercase tracking-wider">
            <FileText size={14} className="text-fw-accent" />
            <span>New Narrative Document</span>
          </div>
          <button
            onClick={onClose}
            className="text-fw-muted hover:text-fw-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="block text-fw-muted mb-1">Document Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 GDD, Main Quest Script, World Lore..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2.5 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          <div>
            <label className="block text-fw-muted mb-1">Template / Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full bg-fw-bg border border-fw-border rounded px-2.5 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            >
              <option value="gdd">Game Design Document (GDD)</option>
              <option value="screenplay">Screenplay / Linear Script</option>
              <option value="lore">World & Lore Sheet</option>
              <option value="quest_brief">Quest Brief</option>
              <option value="notes">Design Notes</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-fw-border text-fw-muted hover:text-fw-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-3 py-1.5 rounded bg-fw-accent text-white hover:bg-fw-accent-hover disabled:opacity-50"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
