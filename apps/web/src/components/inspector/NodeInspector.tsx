import React, { useState } from "react";
import type {
  AnyDialogueNode,
  DialogueNodePriority,
  FalseConditionAction,
  CustomField,
  CustomFieldType,
} from "@freewrite/core";
import { useConversationStore } from "../../stores/conversationStore";
import { useProjectStore } from "../../stores/projectStore";
import {
  Trash2,
  Code,
  Film,
  Plus,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface NodeInspectorProps {
  node: AnyDialogueNode;
}

const PRIORITIES: DialogueNodePriority[] = [
  "Low",
  "BelowNormal",
  "Normal",
  "AboveNormal",
  "High",
];

const SEQUENCE_PRESETS = [
  "Camera(Closeup, speaker, 2); Delay({{end}})",
  "Camera(Medium, listener, 2); Delay({{end}})",
  "Audio(sfx_dialogue); Delay({{end}})",
  "Delay({{end}})",
];

export function NodeInspector({ node }: NodeInspectorProps) {
  const { updateNode, removeNode, setStartNode } = useConversationStore();
  const project = useProjectStore((s) => s.project);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);

  const isCurrentStart = activeConv?.startNodeId === node.id;
  const isDialogueLike = node.type === "dialogue" || node.type === "player_response";

  const handleInsertTag = (tagTemplate: string) => {
    if (node.type === "dialogue") {
      updateNode(node.id, {
        dialogueText: (node.dialogueText || "") + tagTemplate,
      });
    } else if (node.type === "player_response") {
      updateNode(node.id, {
        responseText: (node.responseText || "") + tagTemplate,
      });
    }
  };

  const handleAddField = () => {
    if (!isDialogueLike) return;
    const currentFields = (node as any).fields || [];
    const updated: CustomField[] = [
      ...currentFields,
      { title: "New Field", type: "Text", value: "" },
    ];
    updateNode(node.id, { fields: updated } as any);
  };

  const handleUpdateField = (index: number, patch: Partial<CustomField>) => {
    if (!isDialogueLike) return;
    const currentFields = [...((node as any).fields || [])];
    currentFields[index] = { ...currentFields[index], ...patch };
    updateNode(node.id, { fields: currentFields } as any);
  };

  const handleDeleteField = (index: number) => {
    if (!isDialogueLike) return;
    const currentFields = ((node as any).fields || []).filter(
      (_: any, i: number) => i !== index
    );
    updateNode(node.id, { fields: currentFields } as any);
  };

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
                Entry (0)
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

      {/* Meta info & External ID */}
      <div className="space-y-1 bg-fw-bg p-2 rounded border border-fw-border/60 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-fw-muted">DS4U Entry ID:</span>
          <span className="font-mono text-amber-400 font-bold">
            #{node.externalId ?? (isCurrentStart ? "0" : "Auto")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-fw-muted">Position (canvasRect):</span>
          <span className="font-mono text-fw-muted/80">
            {Math.round(node.position.x)};{Math.round(node.position.y)}
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

      {/* Dialogue Node */}
      {node.type === "dialogue" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-fw-muted block mb-1">Actor (Speaker)</label>
              <select
                value={node.speakerId || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    speakerId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                <option value="">(Narrator / Default)</option>
                {project?.actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name} {actor.isPlayer ? "(Player)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-fw-muted block mb-1">Conversant (Listener)</label>
              <select
                value={node.conversantId || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    conversantId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                <option value="">(None / Default)</option>
                {project?.actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Location (Optional)</label>
            <select
              value={node.locationId || ""}
              onChange={(e) =>
                updateNode(node.id, {
                  locationId: e.target.value ? e.target.value : null,
                })
              }
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            >
              <option value="">(Inherit / None)</option>
              {(project?.locations || []).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Menu Text (Title)</label>
            <input
              type="text"
              value={node.menuText || ""}
              onChange={(e) => updateNode(node.id, { menuText: e.target.value })}
              placeholder="Choice preview in player menu..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          {/* Dialogue Text with Tag Insertions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-fw-muted block">Dialogue Spoken Text</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertTag('[var=Gold]')}
                  className="px-1.5 py-0.5 bg-fw-bg hover:bg-fw-panel border border-fw-border rounded text-[10px] text-amber-400 font-mono"
                  title="Insert variable tag [var=Name]"
                >
                  + [var=]
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[lua(Variable["Gold"])]')}
                  className="px-1.5 py-0.5 bg-fw-bg hover:bg-fw-panel border border-fw-border rounded text-[10px] text-sky-400 font-mono"
                  title="Insert Lua tag [lua(expression)]"
                >
                  + [lua()]
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={node.dialogueText || ""}
              onChange={(e) => updateNode(node.id, { dialogueText: e.target.value })}
              placeholder="Spoken dialogue line..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
            />
          </div>

          {/* Conditions (Lua) */}
          <div>
            <label className="text-fw-muted block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Code size={12} className="text-amber-400" />
                Conditions (Lua)
              </span>
              <span className="text-[10px] text-fw-muted font-normal">
                e.g. Variable["Gold"] &gt;= 10
              </span>
            </label>
            <input
              type="text"
              value={node.conditionsString || ""}
              onChange={(e) =>
                updateNode(node.id, { conditionsString: e.target.value })
              }
              placeholder="Variable['Gold'] >= 10"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          {/* Script (Lua) */}
          <div>
            <label className="text-fw-muted block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-sky-400" />
                Script (Lua Executed On Entry)
              </span>
              <span className="text-[10px] text-fw-muted font-normal">
                e.g. Variable["Gold"] = Variable["Gold"] - 10
              </span>
            </label>
            <textarea
              rows={2}
              value={node.script || ""}
              onChange={(e) => updateNode(node.id, { script: e.target.value })}
              placeholder="Variable['Gold'] = Variable['Gold'] - 10; ShowAlert('Item bought!')"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
            />
          </div>

          {/* Sequence (DS4U Cutscenes) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-fw-muted flex items-center gap-1">
                <Film size={12} className="text-purple-400" />
                Sequence (Cutscenes)
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    updateNode(node.id, { sequence: e.target.value });
                    e.target.value = "";
                  }
                }}
                className="bg-fw-bg border border-fw-border rounded px-1 text-[10px] text-fw-muted"
                defaultValue=""
              >
                <option value="" disabled>
                  Insert Preset…
                </option>
                {SEQUENCE_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p.slice(0, 24)}…
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={node.sequence || ""}
              onChange={(e) => updateNode(node.id, { sequence: e.target.value })}
              placeholder="Camera(Closeup, speaker, 2); Delay({{end}})"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          {/* False Condition Action & Priority */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-fw-muted block mb-1">False Condition Action</label>
              <select
                value={node.falseConditionAction || "Block"}
                onChange={(e) =>
                  updateNode(node.id, {
                    falseConditionAction: e.target.value as FalseConditionAction,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                <option value="Block">Block</option>
                <option value="Passthrough">Passthrough</option>
              </select>
            </div>
            <div>
              <label className="text-fw-muted block mb-1">Priority</label>
              <select
                value={node.priority || "Normal"}
                onChange={(e) =>
                  updateNode(node.id, {
                    priority: e.target.value as DialogueNodePriority,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Player Response Node */}
      {node.type === "player_response" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
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
                    {actor.name} {actor.isPlayer ? "(Player)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-fw-muted block mb-1">Conversant (Listener)</label>
              <select
                value={node.conversantId || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    conversantId: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                <option value="">(None / Default)</option>
                {project?.actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-fw-muted block mb-1">Menu Option Label (Title)</label>
            <input
              type="text"
              value={node.menuText || ""}
              onChange={(e) => updateNode(node.id, { menuText: e.target.value })}
              placeholder="Choice shown in player response menu..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-fw-muted block">Spoken Line (Optional)</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertTag('[var=Gold]')}
                  className="px-1.5 py-0.5 bg-fw-bg hover:bg-fw-panel border border-fw-border rounded text-[10px] text-amber-400 font-mono"
                  title="Insert variable tag [var=Name]"
                >
                  + [var=]
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[lua(Variable["Gold"])]')}
                  className="px-1.5 py-0.5 bg-fw-bg hover:bg-fw-panel border border-fw-border rounded text-[10px] text-sky-400 font-mono"
                  title="Insert Lua tag [lua(expression)]"
                >
                  + [lua()]
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={node.responseText || ""}
              onChange={(e) => updateNode(node.id, { responseText: e.target.value })}
              placeholder="Full line spoken if player selects this choice..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
            />
          </div>

          {/* Conditions (Lua) */}
          <div>
            <label className="text-fw-muted block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Code size={12} className="text-amber-400" />
                Choice Condition (Lua)
              </span>
              <span className="text-[10px] text-fw-muted font-normal">
                e.g. Variable["Gold"] &gt;= 50
              </span>
            </label>
            <input
              type="text"
              value={node.conditionsString || ""}
              onChange={(e) =>
                updateNode(node.id, { conditionsString: e.target.value })
              }
              placeholder="Variable['Gold'] >= 50"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          {/* Script (Lua) */}
          <div>
            <label className="text-fw-muted block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-sky-400" />
                Script (Lua Executed On Selection)
              </span>
            </label>
            <textarea
              rows={2}
              value={node.script || ""}
              onChange={(e) => updateNode(node.id, { script: e.target.value })}
              placeholder="Variable['Gold'] = Variable['Gold'] - 50; ShowAlert('Accepted')"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
            />
          </div>

          {/* False Condition Action & Priority */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-fw-muted block mb-1">False Condition Action</label>
              <select
                value={node.falseConditionAction || "Block"}
                onChange={(e) =>
                  updateNode(node.id, {
                    falseConditionAction: e.target.value as FalseConditionAction,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                <option value="Block">Block (Disable Option)</option>
                <option value="Passthrough">Passthrough</option>
              </select>
            </div>
            <div>
              <label className="text-fw-muted block mb-1">Priority</label>
              <select
                value={node.priority || "Normal"}
                onChange={(e) =>
                  updateNode(node.id, {
                    priority: e.target.value as DialogueNodePriority,
                  })
                }
                className="w-full bg-fw-bg border border-fw-border rounded px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Condition Node (Legacy/Visual Node) */}
      {node.type === "condition" && (
        <div className="space-y-3">
          <div>
            <label className="text-fw-muted block mb-1">Condition Expression (Lua)</label>
            <input
              type="text"
              value={node.expression || ""}
              onChange={(e) => updateNode(node.id, { expression: e.target.value })}
              placeholder="e.g. Variable['HasMetMira'] == true"
              className="w-full font-mono bg-fw-bg border border-fw-border rounded px-2 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>
        </div>
      )}

      {/* Custom User Fields Section for Dialogue & Player Response Nodes */}
      {isDialogueLike && (
        <div className="pt-3 border-t border-fw-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} />
              Custom Fields (DS4U)
            </span>
            <button
              onClick={handleAddField}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-fw-bg border border-fw-border rounded hover:bg-fw-panel text-fw-accent transition-colors"
            >
              <Plus size={10} /> Add
            </button>
          </div>

          {(!(node as any).fields || (node as any).fields.length === 0) ? (
            <div className="text-[10px] text-fw-muted py-1.5 italic bg-fw-bg/40 px-2 rounded border border-dashed border-fw-border">
              No custom fields on this entry.
            </div>
          ) : (
            <div className="space-y-1.5">
              {(node as any).fields.map((f: CustomField, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 p-1 bg-fw-bg border border-fw-border rounded"
                >
                  <input
                    type="text"
                    value={f.title}
                    placeholder="Field"
                    onChange={(e) =>
                      handleUpdateField(idx, { title: e.target.value })
                    }
                    className="flex-1 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                  />
                  <select
                    value={f.type}
                    onChange={(e) =>
                      handleUpdateField(idx, {
                        type: e.target.value as CustomFieldType,
                      })
                    }
                    className="bg-fw-panel border border-fw-border rounded px-1 py-0.5 text-[10px] focus:outline-none"
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Num</option>
                    <option value="Boolean">Bool</option>
                  </select>
                  <input
                    type="text"
                    value={f.value}
                    placeholder="Val"
                    onChange={(e) =>
                      handleUpdateField(idx, { value: e.target.value })
                    }
                    className="flex-1 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleDeleteField(idx)}
                    className="p-1 text-fw-muted hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
