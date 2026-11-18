import React from "react";
import type { Conversation } from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";

interface ConversationInspectorProps {
  conversation: Conversation;
}

export function ConversationInspector({ conversation }: ConversationInspectorProps) {
  const updateConversation = useProjectStore((s) => s.updateConversation);
  const project = useProjectStore((s) => s.project);
  const setStartNode = useConversationStore((s) => s.setStartNode);

  const startNodes = conversation.nodes.filter((n) => n.type === "start");

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
      <div>
        <span className="text-[10px] uppercase font-bold text-fw-muted tracking-wider">
          Conversation
        </span>
        <h3 className="text-sm font-semibold text-fw-text truncate">
          {conversation.title}
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-fw-muted block mb-1">Title</label>
          <input
            type="text"
            value={conversation.title}
            onChange={(e) =>
              updateConversation(conversation.id, { title: e.target.value })
            }
            className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
          />
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Description</label>
          <textarea
            rows={3}
            value={conversation.description}
            onChange={(e) =>
              updateConversation(conversation.id, { description: e.target.value })
            }
            placeholder="Context or synopsis for this dialogue..."
            className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
          />
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Primary Actor</label>
          <select
            value={conversation.actorId || ""}
            onChange={(e) =>
              updateConversation(conversation.id, {
                actorId: e.target.value ? e.target.value : null,
              })
            }
            className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
          >
            <option value="">(None)</option>
            {project?.actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Conversant</label>
          <select
            value={conversation.conversantId || ""}
            onChange={(e) =>
              updateConversation(conversation.id, {
                conversantId: e.target.value ? e.target.value : null,
              })
            }
            className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
          >
            <option value="">(None)</option>
            {project?.actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Entry Point (Start Node)</label>
          <select
            value={conversation.startNodeId || ""}
            onChange={(e) => setStartNode(e.target.value || null)}
            className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
          >
            <option value="">(Automatic / None)</option>
            {startNodes.map((n) => (
              <option key={n.id} value={n.id}>
                Start Node ({n.label || n.id.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-fw-border" />

      {/* Statistics */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-fw-muted">Nodes:</span>
          <span className="font-semibold text-fw-text">{conversation.nodes.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fw-muted">Transitions:</span>
          <span className="font-semibold text-fw-text">{conversation.connections.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fw-muted">Start Nodes:</span>
          <span className={startNodes.length === 1 ? "text-green-400 font-semibold" : "text-amber-400 font-semibold"}>
            {startNodes.length}
          </span>
        </div>
      </div>
    </div>
  );
}
