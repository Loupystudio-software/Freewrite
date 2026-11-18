import React, { useState } from "react";
import { Save, Settings, Users } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";

interface Props {
  onNewProject: () => void;
}

export function TopBar({ onNewProject }: Props) {
  const { project, saveStatus, isDirty, saveToHandle } = useProjectStore();
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const handleNameClick = () => {
    if (!project) return;
    setNameInput(project.project.name);
    setEditingName(true);
  };

  const commitName = () => {
    if (nameInput.trim()) updateProjectMeta({ name: nameInput.trim() });
    setEditingName(false);
  };

  const saveLabel = () => {
    switch (saveStatus) {
      case "saved": return "Saved ✓";
      case "saving": return "Saving…";
      case "unsaved": return "Unsaved ●";
      case "failed": return "Save failed ✗";
      default: return "";
    }
  };

  const saveColor = () => {
    switch (saveStatus) {
      case "saved": return "text-fw-success";
      case "saving": return "text-fw-muted";
      case "unsaved": return "text-fw-warning";
      case "failed": return "text-fw-error";
      default: return "text-fw-muted";
    }
  };

  return (
    <div className="h-10 bg-fw-panel border-b border-fw-border flex items-center px-3 gap-3 select-none shrink-0">
      <div className="w-7 h-7 bg-fw-accent rounded-sm flex items-center justify-center text-white font-bold text-xs shrink-0">
        FW
      </div>

      {editingName ? (
        <input
          className="bg-fw-bg border border-fw-accent rounded-sm px-2 py-0.5 text-sm text-fw-text focus:outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditingName(false); }}
          autoFocus
        />
      ) : (
        <span
          className={`text-sm font-medium cursor-pointer hover:text-fw-accent transition-colors ${project ? "text-fw-text" : "text-fw-muted"}`}
          onClick={handleNameClick}
          title={project ? "Click to rename" : ""}
        >
          {project?.project.name ?? "No project"}
        </span>
      )}

      {saveStatus !== "none" && (
        <span className={`text-xs ml-1 ${saveColor()}`}>{saveLabel()}</span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {project && isDirty && (
          <button
            onClick={() => saveToHandle()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-fw-muted hover:text-fw-text border border-fw-border rounded-sm hover:border-fw-text transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save size={12} />
            Save
          </button>
        )}
        <button className="p-1 text-fw-muted hover:text-fw-text transition-colors" title="Collaborators (Milestone 4)">
          <Users size={15} />
        </button>
        <button className="p-1 text-fw-muted hover:text-fw-text transition-colors" title="Settings">
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
