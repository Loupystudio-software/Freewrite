import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DialogueNode as CoreDialogueNode } from "@freewrite/core";
import { MessageSquare, Code, Sparkles } from "lucide-react";
import { useProjectStore } from "../../../stores/projectStore";

export function DialogueNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreDialogueNode }).coreNode;
  const project = useProjectStore((s) => s.project);
  const speaker = project?.actors.find((a) => a.id === node?.speakerId);
  const actorColor = speaker?.color || "#3b82f6";

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded border bg-[#1e2233] p-2.5 text-xs text-fw-text transition-all ${
        selected ? "border-blue-400 ring-2 ring-blue-400/40" : "border-blue-500/70 shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-[#1a1a1a]"
      />

      <div className="flex items-center justify-between border-b border-blue-500/30 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-blue-400">
          <MessageSquare size={12} />
          <span>Dialogue</span>
          {node?.externalId !== undefined && node.externalId !== null && (
            <span className="text-[10px] text-amber-400 font-mono">#{node.externalId}</span>
          )}
        </div>
        <div className="flex items-center gap-1 truncate max-w-[120px]">
          {speaker && (
            <div
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: actorColor }}
            >
              {speaker.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-[11px] font-medium text-fw-text truncate">
            {speaker ? speaker.name : node?.speakerId ? "Actor" : "Narrator"}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-fw-text/90 line-clamp-3 leading-relaxed whitespace-pre-wrap break-words min-h-[1.5rem]">
        {node?.dialogueText || <span className="italic text-fw-muted">Empty dialogue</span>}
      </div>

      {/* Indicators row */}
      {(node?.conditionsString || node?.script || node?.sequence) && (
        <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-fw-border/30 text-[9px] font-mono text-fw-muted">
          {node.conditionsString && (
            <span className="flex items-center gap-0.5 text-amber-400/90" title={`Lua Condition: ${node.conditionsString}`}>
              <Code size={10} /> Cond
            </span>
          )}
          {node.script && (
            <span className="flex items-center gap-0.5 text-sky-400/90" title={`Lua Script: ${node.script}`}>
              <Sparkles size={10} /> Script
            </span>
          )}
          {node.sequence && (
            <span className="text-purple-400/80 truncate max-w-[80px]" title={`Sequence: ${node.sequence}`}>
              Seq
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
