import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useDocumentStore } from "../../stores/documentStore";
import { useLocationStore } from "../../stores/locationStore";
import { DialogueCanvas } from "../canvas/DialogueCanvas";
import { DocumentEditor } from "../documents/DocumentEditor";
import { LocationEditor } from "../locations/LocationEditor";
import { MessageSquarePlus, FileText, MapPin } from "lucide-react";

interface CanvasAreaProps {
  onNewConversation?: () => void;
  onNewDocument?: () => void;
  onNewLocation?: () => void;
}

export function CanvasArea({
  onNewConversation,
  onNewDocument,
  onNewLocation,
}: CanvasAreaProps) {
  const project = useProjectStore((s) => s.project);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const { activeDocumentId, viewMode } = useDocumentStore();
  const activeLocationId = useLocationStore((s) => s.activeLocationId);
  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);
  const activeDoc = project?.documents?.find((d) => d.id === activeDocumentId);
  const activeLoc = project?.locations?.find((l) => l.id === activeLocationId);

  if (!project) {
    return (
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, #262626 1px, transparent 1px),
            linear-gradient(to bottom, #262626 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
          backgroundColor: "#181818",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center select-none">
            <div className="text-fw-muted text-sm font-medium mb-1">
              Open or create a project to begin
            </div>
            <div className="text-fw-muted/60 text-xs">
              Use the sidebar to start writing branching dialogue
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "document" && activeDoc) {
    return <DocumentEditor key={activeDoc.id} document={activeDoc} project={project} />;
  }

  if (viewMode === "location" && activeLoc) {
    return <LocationEditor key={activeLoc.id} location={activeLoc} project={project} />;
  }

  if (!activeConv) {
    return (
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, #262626 1px, transparent 1px),
            linear-gradient(to bottom, #262626 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
          backgroundColor: "#181818",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center select-none flex flex-col items-center">
            <div className="text-fw-muted text-sm font-medium mb-1">
              No conversation or document selected
            </div>
            <div className="text-fw-muted/60 text-xs mb-4">
              Select an item from the sidebar or create a new one
            </div>
            <div className="flex items-center gap-2">
              {onNewConversation && (
                <button
                  onClick={onNewConversation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-fw-accent text-white rounded text-xs hover:bg-fw-accent-hover transition-colors shadow"
                >
                  <MessageSquarePlus size={14} />
                  <span>New Conversation</span>
                </button>
              )}
              {onNewDocument && (
                <button
                  onClick={onNewDocument}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded text-xs hover:bg-sky-500 transition-colors shadow"
                >
                  <FileText size={14} />
                  <span>New Document</span>
                </button>
              )}
              {onNewLocation && (
                <button
                  onClick={onNewLocation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-500 transition-colors shadow"
                >
                  <MapPin size={14} />
                  <span>New Location</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <DialogueCanvas key={activeConv.id} conversation={activeConv} />
    </div>
  );
}
