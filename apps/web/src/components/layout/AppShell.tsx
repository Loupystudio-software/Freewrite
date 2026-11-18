import React, { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { CanvasArea } from "./CanvasArea";
import { Inspector } from "./Inspector";
import { BottomBar } from "./BottomBar";
import { NewProjectDialog } from "../dialogs/NewProjectDialog";
import { NewConversationDialog } from "../dialogs/NewConversationDialog";
import { VariablesModal } from "../dialogs/VariablesModal";
import { DialogueSimulatorModal } from "../simulation/DialogueSimulatorModal";
import { CollaborationModal } from "../dialogs/CollaborationModal";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";

export function AppShell() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);

  const { project, saveToHandle, isDirty } = useProjectStore();
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveToHandle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveToHandle]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <div className="h-screen flex flex-col bg-fw-bg text-fw-text overflow-hidden select-none">
      <TopBar
        onNewProject={() => setShowNewProject(true)}
        onOpenVariables={() => setShowVariablesModal(true)}
        onOpenSimulator={() => setShowSimulatorModal(true)}
        onOpenCollaboration={() => setShowCollaborationModal(true)}
      />

      {/* Menu bar */}
      <div className="h-7 bg-fw-panel border-b border-fw-border flex items-center px-2 gap-1 shrink-0 text-xs text-fw-muted">
        <button
          onClick={() => setShowNewProject(true)}
          className="px-2 py-0.5 hover:text-fw-text hover:bg-fw-bg rounded-sm transition-colors"
        >
          New Project
        </button>
        {project && (
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-2 py-0.5 hover:text-fw-text hover:bg-fw-bg rounded-sm transition-colors"
          >
            New Conversation
          </button>
        )}
        {project && (
          <button
            onClick={() => setShowVariablesModal(true)}
            className="px-2 py-0.5 hover:text-fw-text hover:bg-fw-bg rounded-sm transition-colors"
          >
            Variables ({project.variables.length})
          </button>
        )}
        {project && (
          <button
            onClick={() => setShowCollaborationModal(true)}
            className="px-2 py-0.5 hover:text-fw-text hover:bg-fw-bg rounded-sm transition-colors"
          >
            Collaborate
          </button>
        )}
        {project && activeConv && (
          <button
            onClick={() => setShowSimulatorModal(true)}
            className="px-2 py-0.5 text-green-400 hover:text-green-300 hover:bg-fw-bg rounded-sm transition-colors"
          >
            Simulate Dialogue
          </button>
        )}
        {project && (
          <button
            onClick={() => saveToHandle()}
            className="px-2 py-0.5 hover:text-fw-text hover:bg-fw-bg rounded-sm transition-colors ml-auto"
          >
            Save Project
          </button>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onNewProject={() => setShowNewProject(true)}
          onNewConversation={() => setShowNewConversation(true)}
        />
        <CanvasArea onNewConversation={() => setShowNewConversation(true)} />
        <Inspector />
      </div>

      <BottomBar />

      {showNewProject && (
        <NewProjectDialog onClose={() => setShowNewProject(false)} />
      )}
      {showNewConversation && (
        <NewConversationDialog onClose={() => setShowNewConversation(false)} />
      )}
      {showVariablesModal && (
        <VariablesModal onClose={() => setShowVariablesModal(false)} />
      )}
      {showCollaborationModal && (
        <CollaborationModal onClose={() => setShowCollaborationModal(false)} />
      )}
      {showSimulatorModal && activeConv && project && (
        <DialogueSimulatorModal
          conversation={activeConv}
          project={project}
          onClose={() => setShowSimulatorModal(false)}
        />
      )}
    </div>
  );
}
