import React from "react";
import {
  FolderOpen,
  FilePlus,
  Save,
  Download,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import { openProjectFile } from "../../features/storage/fileSystemAccess";

interface Props {
  onNewProject: () => void;
  onNewConversation: () => void;
}

export function Sidebar({ onNewProject, onNewConversation }: Props) {
  const { project, saveToHandle, saveAs, loadProject, setFileHandle } = useProjectStore();
  const { activeConversationId, openConversation, deleteConversation } =
    useConversationStore();

  const handleOpen = async () => {
    try {
      const { raw, handle } = await openProjectFile();
      loadProject(raw);
      if (handle) setFileHandle(handle);
    } catch (e) {
      if ((e as Error).message !== "AbortError") {
        alert(`Failed to open project: ${(e as Error).message}`);
      }
    }
  };

  const handleDeleteConv = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete conversation "${title}"?`)) {
      deleteConversation(id);
    }
  };

  return (
    <div className="w-56 bg-fw-panel border-r border-fw-border flex flex-col shrink-0 select-none">
      {/* Project Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-fw-border">
        <span className="text-xs font-semibold text-fw-muted uppercase tracking-wider">
          Project
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewProject}
            className="p-1 text-fw-muted hover:text-fw-text transition-colors"
            title="New Project"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={handleOpen}
            className="p-1 text-fw-muted hover:text-fw-text transition-colors"
            title="Open Project"
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      {/* Conversations Section */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider">
          Conversations
        </span>
        {project && (
          <button
            onClick={onNewConversation}
            className="p-1 text-fw-muted hover:text-fw-accent transition-colors"
            title="New Conversation"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!project ? (
          <div className="text-xs text-fw-muted text-center mt-6 leading-relaxed px-2">
            Create or open a project to get started.
          </div>
        ) : project.conversations.length === 0 ? (
          <div className="text-xs text-fw-muted text-center mt-6 leading-relaxed px-2">
            No conversations yet.
            <button
              onClick={onNewConversation}
              className="mt-2 block w-full py-1 text-xs text-fw-accent hover:underline"
            >
              + Create Conversation
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {project.conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <li
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-sm text-xs cursor-pointer transition-colors ${isActive
                    ? "bg-fw-bg text-fw-accent font-medium border-l-2 border-fw-accent"
                    : "text-fw-text hover:bg-fw-bg"
                    }`}
                  title={conv.title}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <MessageSquare size={13} className="shrink-0 opacity-70" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConv(e, conv.id, conv.title)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-fw-error text-fw-muted transition-opacity shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer Save Actions */}
      {project && (
        <div className="border-t border-fw-border p-2 flex gap-1">
          <button
            onClick={() => saveToHandle()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-fw-muted border border-fw-border rounded-sm hover:text-fw-text hover:border-fw-text transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save size={12} /> Save
          </button>
          <button
            onClick={() => saveAs()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-fw-muted border border-fw-border rounded-sm hover:text-fw-text hover:border-fw-text transition-colors"
            title="Save As"
          >
            <Download size={12} /> Save As
          </button>
        </div>
      )}
    </div>
  );
}
