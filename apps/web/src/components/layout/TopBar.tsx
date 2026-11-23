import React, { useState, useEffect } from "react";
import { Save, Settings, Users, Sliders, Play, Wifi, ArrowDownUp } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import {
  collaborationManager,
  type ConnectionState,
  type Collaborator,
} from "../../features/collaboration/collaborationManager";

interface Props {
  onNewProject: () => void;
  onOpenVariables: () => void;
  onOpenSimulator: () => void;
  onOpenCollaboration: () => void;
  onOpenImportExport: (tab?: "import" | "export") => void;
}

export function TopBar({
  onNewProject,
  onOpenVariables,
  onOpenSimulator,
  onOpenCollaboration,
  onOpenImportExport,
}: Props) {
  const { project, saveStatus, isDirty, saveToHandle } = useProjectStore();
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [collabStatus, setCollabStatus] = useState<ConnectionState>(
    collaborationManager.status
  );
  const [collaborators, setCollaborators] = useState<Collaborator[]>(
    collaborationManager.collaborators
  );

  useEffect(() => {
    const unsubStatus = collaborationManager.onStatusChange(setCollabStatus);
    const unsubCollab = collaborationManager.onCollaboratorsChange(setCollaborators);
    return () => {
      unsubStatus();
      unsubCollab();
    };
  }, []);

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
      case "saved":
        return "Saved ✓";
      case "saving":
        return "Saving…";
      case "unsaved":
        return "Unsaved ●";
      case "failed":
        return "Save failed ✗";
      default:
        return "";
    }
  };

  const saveColor = () => {
    switch (saveStatus) {
      case "saved":
        return "text-fw-success";
      case "saving":
        return "text-fw-muted";
      case "unsaved":
        return "text-fw-warning";
      case "failed":
        return "text-fw-error";
      default:
        return "text-fw-muted";
    }
  };

  return (
    <div className="h-10 bg-fw-panel border-b border-fw-border flex items-center px-3 gap-3 select-none shrink-0">
      <div className="w-7 h-7 bg-fw-accent rounded-sm flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
        FW
      </div>

      {editingName ? (
        <input
          className="bg-fw-bg border border-fw-accent rounded-sm px-2 py-0.5 text-sm text-fw-text focus:outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitName();
            if (e.key === "Escape") setEditingName(false);
          }}
          autoFocus
        />
      ) : (
        <span
          className={`text-sm font-medium cursor-pointer hover:text-fw-accent transition-colors ${
            project ? "text-fw-text" : "text-fw-muted"
          }`}
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

      {/* Main Action Shortcuts */}
      {project && (
        <div className="flex items-center gap-1.5 mr-2">
          {/* Variables Manager button */}
          <button
            onClick={onOpenVariables}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-fw-muted hover:text-fw-text bg-fw-bg border border-fw-border rounded hover:border-fw-text transition-colors"
            title="Manage Project Variables"
          >
            <Sliders size={13} className="text-fw-accent" />
            <span>Variables</span>
            <span className="px-1.5 py-0.2 rounded-full bg-fw-panel border border-fw-border text-[10px] text-fw-muted">
              {project.variables.length}
            </span>
          </button>

          {/* Test Dialogue Simulator button */}
          {activeConversationId && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-green-300 bg-green-950/40 border border-green-600/50 hover:bg-green-900/40 rounded transition-colors font-medium shadow-sm"
              title="Test & Simulate Conversation"
            >
              <Play size={12} fill="currentColor" className="text-green-400" />
              <span>Simulate</span>
            </button>
          )}

          {/* Dialogue System Unity Import/Export */}
          <button
            onClick={() => onOpenImportExport("export")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-fw-muted hover:text-fw-text bg-fw-bg border border-fw-border rounded hover:border-fw-text transition-colors"
            title="Export / Import Dialogue System for Unity (CSV / Chat Mapper XML)"
          >
            <ArrowDownUp size={13} className="text-amber-400" />
            <span>Unity DS4U</span>
          </button>
        </div>
      )}

      {/* Collaborators & Presence */}
      <div className="flex items-center gap-1">
        {/* Avatars of active collaborators */}
        {collaborators.map((c) => (
          <div
            key={c.clientId}
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow cursor-pointer border border-black/40 hover:scale-105 transition-transform"
            style={{ backgroundColor: c.color }}
            title={`${c.name} (Online)`}
            onClick={onOpenCollaboration}
          >
            {c.name.slice(0, 2).toUpperCase()}
          </div>
        ))}

        <button
          onClick={onOpenCollaboration}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors ${
            collabStatus === "connected"
              ? "bg-green-950/30 text-green-300 border-green-600/50 hover:bg-green-900/40"
              : "text-fw-muted hover:text-fw-text border-fw-border hover:border-fw-text bg-fw-bg"
          }`}
          title="Collaborators & Multiuser Sync"
        >
          {collabStatus === "connected" ? (
            <Wifi size={13} className="text-green-400" />
          ) : (
            <Users size={13} />
          )}
          <span>
            {collabStatus === "connected"
              ? `Live (${collaborators.length + 1})`
              : "Collaborate"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 ml-1">
        {project && isDirty && (
          <button
            onClick={() => saveToHandle()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-fw-muted hover:text-fw-text border border-fw-border rounded hover:border-fw-text transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save size={12} />
            Save
          </button>
        )}
        <button
          className="p-1 text-fw-muted hover:text-fw-text transition-colors"
          title="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
