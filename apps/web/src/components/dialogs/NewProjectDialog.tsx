import React, { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";

interface Props {
  onClose: () => void;
}

export function NewProjectDialog({ onClose }: Props) {
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState("My Project");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) { setError("Project name is required."); return; }
    createProject(name.trim(), author.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-fw-panel border border-fw-border rounded-sm w-96 p-5 shadow-xl">
        <h2 className="text-sm font-semibold mb-4 text-fw-text uppercase tracking-wide">New Project</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-fw-muted block mb-1">Project Name *</label>
            <input
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-3 py-1.5 text-sm text-fw-text focus:outline-none focus:border-fw-accent"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") onClose(); }}
              autoFocus
            />
            {error && <p className="text-xs text-fw-error mt-1">{error}</p>}
          </div>
          <div>
            <label className="text-xs text-fw-muted block mb-1">Author</label>
            <input
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-3 py-1.5 text-sm text-fw-text focus:outline-none focus:border-fw-accent"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Optional"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") onClose(); }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-fw-muted border border-fw-border rounded-sm hover:border-fw-text hover:text-fw-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-xs bg-fw-accent text-white rounded-sm hover:bg-fw-accent-hover transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
