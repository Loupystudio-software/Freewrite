import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import { DialogueCanvas } from "../canvas/DialogueCanvas";
import { MessageSquarePlus } from "lucide-react";

interface CanvasAreaProps {
  onNewConversation?: () => void;
}

export function CanvasArea({ onNewConversation }: CanvasAreaProps) {
  const project = useProjectStore((s) => s.project);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);

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
              No conversation selected
            </div>
            <div className="text-fw-muted/60 text-xs mb-4">
              Select a conversation from the sidebar or create a new one
            </div>
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-fw-accent text-white rounded text-xs hover:bg-fw-accent-hover transition-colors shadow"
              >
                <MessageSquarePlus size={14} />
                <span>New Conversation</span>
              </button>
            )}
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
