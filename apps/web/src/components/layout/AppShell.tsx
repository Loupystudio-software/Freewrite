import React, { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { CanvasArea } from "./CanvasArea";
import { Inspector } from "./Inspector";
import { BottomBar } from "./BottomBar";
import { NewProjectDialog } from "../dialogs/NewProjectDialog";
import { NewConversationDialog } from "../dialogs/NewConversationDialog";
import { NewDocumentDialog } from "../dialogs/NewDocumentDialog";
import { NewLocationDialog } from "../dialogs/NewLocationDialog";
import { VariablesModal } from "../dialogs/VariablesModal";
import { ActorsModal } from "../dialogs/ActorsModal";
import { QuestsModal } from "../dialogs/QuestsModal";
import { DialogueSimulatorModal } from "../simulation/DialogueSimulatorModal";
import { CollaborationModal } from "../dialogs/CollaborationModal";
import { ImportExportModal } from "../dialogs/ImportExportModal";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";

export function AppShell() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showActorsModal, setShowActorsModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportTab, setImportExportTab] = useState<"import" | "export">("export");

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
        onOpenActors={() => setShowActorsModal(true)}
        onOpenQuests={() => setShowQuestsModal(true)}
        onOpenVariables={() => setShowVariablesModal(true)}
        onOpenSimulator={() => setShowSimulatorModal(true)}
        onOpenCollaboration={() => setShowCollaborationModal(true)}
        onOpenImportExport={(tab = "export") => {
          setImportExportTab(tab);
          setShowImportExportModal(true);
        }}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onNewProject={() => setShowNewProject(true)}
          onNewConversation={() => setShowNewConversation(true)}
          onNewDocument={() => setShowNewDocument(true)}
          onNewLocation={() => setShowNewLocation(true)}
        />
        <CanvasArea
          onNewConversation={() => setShowNewConversation(true)}
          onNewDocument={() => setShowNewDocument(true)}
          onNewLocation={() => setShowNewLocation(true)}
        />
        <Inspector />
      </div>

      <BottomBar />

      {showNewProject && (
        <NewProjectDialog onClose={() => setShowNewProject(false)} />
      )}
      {showNewConversation && (
        <NewConversationDialog onClose={() => setShowNewConversation(false)} />
      )}
      {showNewDocument && (
        <NewDocumentDialog onClose={() => setShowNewDocument(false)} />
      )}
      {showNewLocation && (
        <NewLocationDialog onClose={() => setShowNewLocation(false)} />
      )}
      {showVariablesModal && (
        <VariablesModal onClose={() => setShowVariablesModal(false)} />
      )}
      {showActorsModal && (
        <ActorsModal onClose={() => setShowActorsModal(false)} />
      )}
      {showQuestsModal && (
        <QuestsModal onClose={() => setShowQuestsModal(false)} />
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
      {showImportExportModal && (
        <ImportExportModal
          defaultTab={importExportTab}
          onClose={() => setShowImportExportModal(false)}
        />
      )}
    </div>
  );
}
