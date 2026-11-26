import React from "react";
import {
  FolderOpen,
  FilePlus,
  Save,
  Download,
  Plus,
  Trash2,
  MessageSquare,
  FileText,
  MapPin,
} from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useDocumentStore } from "../../stores/documentStore";
import { useLocationStore } from "../../stores/locationStore";
import { openProjectFile } from "../../features/storage/fileSystemAccess";

interface Props {
  onNewProject: () => void;
  onNewConversation: () => void;
  onNewDocument?: () => void;
  onNewLocation?: () => void;
  onOpenImportExport?: (tab?: "import" | "export") => void;
}

export function Sidebar({
  onNewProject,
  onNewConversation,
  onNewDocument,
  onNewLocation,
  onOpenImportExport,
}: Props) {
  const { project, saveToHandle, saveAs, loadProject, setFileHandle } = useProjectStore();
  const { activeConversationId, openConversation, deleteConversation } =
    useConversationStore();
  const { activeDocumentId, viewMode, openDocument, deleteDocument } =
    useDocumentStore();
  const { activeLocationId, openLocation, deleteLocation } = useLocationStore();

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
              const isActive =
                viewMode === "canvas" && conv.id === activeConversationId;
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

        {/* Documents Section */}
        {project && (
          <div className="mt-4 pt-2 border-t border-fw-border/60">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider">
                Documents
              </span>
              {onNewDocument && (
                <button
                  onClick={onNewDocument}
                  className="p-1 text-fw-muted hover:text-sky-400 transition-colors"
                  title="New Narrative Document"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {(project.documents || []).length === 0 ? (
              <div className="text-[11px] text-fw-muted/70 text-center py-2 px-1">
                No documents yet.
                {onNewDocument && (
                  <button
                    onClick={onNewDocument}
                    className="mt-1 block w-full py-0.5 text-sky-400 hover:underline"
                  >
                    + Create Document
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {(project.documents || []).map((doc) => {
                  const isActive =
                    viewMode === "document" && doc.id === activeDocumentId;
                  return (
                    <li
                      key={doc.id}
                      onClick={() => openDocument(doc.id)}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-sm text-xs cursor-pointer transition-colors ${
                        isActive
                          ? "bg-fw-bg text-sky-400 font-medium border-l-2 border-sky-400"
                          : "text-fw-text hover:bg-fw-bg"
                      }`}
                      title={doc.title}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText size={13} className="shrink-0 opacity-70" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to delete document "${doc.title}"?`
                            )
                          ) {
                            deleteDocument(doc.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-fw-error text-fw-muted transition-opacity shrink-0"
                        title="Delete document"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Locations & World Entities Section */}
        {project && (
          <div className="mt-4 pt-2 border-t border-fw-border/60">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider">
                Locations
              </span>
              {onNewLocation && (
                <button
                  onClick={onNewLocation}
                  className="p-1 text-fw-muted hover:text-emerald-400 transition-colors"
                  title="New Location"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {(project.locations || []).length === 0 ? (
              <div className="text-[11px] text-fw-muted/70 text-center py-2 px-1">
                No locations yet.
                {onNewLocation && (
                  <button
                    onClick={onNewLocation}
                    className="mt-1 block w-full py-0.5 text-emerald-400 hover:underline"
                  >
                    + Create Location
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {(project.locations || []).map((loc) => {
                  const isActive =
                    viewMode === "location" && loc.id === activeLocationId;
                  const isChild = Boolean(loc.parentId);
                  return (
                    <li
                      key={loc.id}
                      onClick={() => openLocation(loc.id)}
                      className={`group flex items-center justify-between py-1.5 rounded-sm text-xs cursor-pointer transition-colors ${
                        isChild ? "pl-5 pr-2" : "px-2"
                      } ${
                        isActive
                          ? "bg-fw-bg text-emerald-400 font-medium border-l-2 border-emerald-400"
                          : "text-fw-text hover:bg-fw-bg"
                      }`}
                      title={loc.name}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin
                          size={13}
                          className="shrink-0 opacity-80"
                          style={{ color: loc.color }}
                        />
                        <span className="truncate">{loc.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to delete location "${loc.name}"?`
                            )
                          ) {
                            deleteLocation(loc.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-fw-error text-fw-muted transition-opacity shrink-0"
                        title="Delete location"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer Save Actions */}
      {project && (
        <div className="border-t border-fw-border p-2 flex flex-col gap-1.5">
          <div className="flex gap-1">
            <button
              onClick={() => saveToHandle()}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-fw-muted border border-fw-border rounded-sm hover:text-fw-text hover:border-fw-text transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save size={12} /> Save
            </button>
            <button
              onClick={() => saveAs()}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-fw-muted border border-fw-border rounded-sm hover:text-fw-text hover:border-fw-text transition-colors"
              title="Save As"
            >
              <Download size={12} /> Save As
            </button>
          </div>
          {onOpenImportExport && (
            <button
              onClick={() => onOpenImportExport("export")}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-amber-400/90 border border-amber-900/40 bg-amber-950/20 rounded-sm hover:text-amber-300 hover:border-amber-700/60 transition-colors"
              title="Export or Import Pixel Crushers Dialogue System format"
            >
              Dialogue System Unity...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
