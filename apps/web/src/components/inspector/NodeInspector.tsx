import React from "react";
import type { AnyDialogueNode } from "@freewrite/core";
import { useConversationStore } from "../../stores/conversationStore";
import { useProjectStore } from "../../stores/projectStore";
import { Trash2 } from "lucide-react";

interface NodeInspectorProps {
  node: AnyDialogueNode;
}

export function NodeInspector({ node }: NodeInspectorProps) {
  const { updateNode, removeNode, setStartNode } = useConversationStore();
  const project = useProjectStore((s) => s.project);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);

  const isCurrentStart = activeConv?.startNodeId === node.id;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
      {/* Node Header */}
      <div className="flex items-center justify-between pb-2 border-b border-fw-border">
        <div>
          <span className="text-[10px] uppercase font-bold text-fw-muted tracking-wider">
            Selected Node
          </span>
          <div className="text-sm font-semibold capitalize text-fw-text flex items-center gap-1.5">
            {node.type.replace("_", " ")}
            {isCurrentStart && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/40 rounded px-1.5 py-0.2">
                Entry
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => removeNode(node.id)}
          className="p-1.5 text-fw-muted hover:text-fw-error hover:bg-fw-bg rounded transition-colors"
          title="Delete Node (Del)"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Meta info */}
      <div className="space-y-1 bg-fw-bg p-2 rounded border border-fw-border/60">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-fw-muted">ID:</span>
          <span className="font-mono text-fw-muted/80 truncate max-w-[140px]" title={node.id}>
            {node.id}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-fw-muted">Position:</span>
          <span className="font-mono text-fw-muted/80">
            {Math.round(node.position.x)}, {Math.round(node.position.y)}
          </span>
        </div>
      </div>

      {/* Type-Specific Editors */}
      {node.type === "start" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Label</label>
            <input
              type="text"
              value={node.label || ""}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              placeholder="e.g. Conversation Start"
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>
          {!isCurrentStart && (
            <button
              onClick={() => setStartNode(node.id)}
              className="w-full py-1.5 bg-green-600/30 text-green-300 border border-green-500/40 rounded hover:bg-green-600/40 transition-colors"
            >
              Set as Conversation Entry Point
            </button>
          )}
        </div>
      )}

      {node.type === "dialogue" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Speaker (Actor)</label>
            <select
              value={node.speakerId || ""}
              onChange={(e) =>
                updateNode(node.id, {
                  speakerId: e.target.value ? e.target.value : null,
                })
              }
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            >
              <option value="">(None / Narrator)</option>
              {project?.actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name} {actor.isPlayer ? "(Player)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Menu Text (Optional)</label>
            <input
              type="text"
              value={node.menuText || ""}
              onChange={(e) => updateNode(node.id, { menuText: e.target.value })}
              placeholder="Brief prompt preview..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Dialogue Text</label>
            <textarea
              rows={5}
              value={node.dialogueText || ""}
              onChange={(e) => updateNode(node.id, { dialogueText: e.target.value })}
              placeholder="Spoken line..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {node.type === "player_response" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Speaker (Player Actor)</label>
            <select
              value={node.speakerId || ""}
              onChange={(e) =>
                updateNode(node.id, {
                  speakerId: e.target.value ? e.target.value : null,
                })
              }
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            >
              <option value="">(Default Player)</option>
              {project?.actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Menu Option Label</label>
            <input
              type="text"
              value={node.menuText || ""}
              onChange={(e) => updateNode(node.id, { menuText: e.target.value })}
              placeholder="Choice shown in player menu..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Response Line</label>
            <textarea
              rows={4}
              value={node.responseText || ""}
              onChange={(e) => updateNode(node.id, { responseText: e.target.value })}
              placeholder="Full line spoken if selected..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {node.type === "condition" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Condition Expression</label>
            <input
              type="text"
              value={node.expression || ""}
              onChange={(e) => updateNode(node.id, { expression: e.target.value })}
              placeholder="e.g. HasMetMira == true"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            />
            <p className="text-[10px] text-fw-muted mt-1">
              Supports simple expressions and variable checks.
            </p>
          </div>
        </div>
      )}

      {node.type === "action" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Action Type</label>
            <input
              type="text"
              value={node.actionType || ""}
              onChange={(e) => updateNode(node.id, { actionType: e.target.value })}
              placeholder="e.g. set_variable, give_quest"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>
        </div>
      )}

      {node.type === "end" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Ending Label (Optional)</label>
            <input
              type="text"
              value={node.label || ""}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              placeholder="e.g. Peaceful resolution"
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>
        </div>
      )}

      {node.type === "comment" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Annotation Note</label>
            <textarea
              rows={6}
              value={node.text || ""}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              placeholder="Design notes or flow explanation..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
