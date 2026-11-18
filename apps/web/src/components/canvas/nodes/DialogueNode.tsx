import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DialogueNode as CoreDialogueNode } from "@freewrite/core";
import { MessageSquare } from "lucide-react";
import { useProjectStore } from "../../../stores/projectStore";

export function DialogueNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreDialogueNode }).coreNode;
  const project = useProjectStore((s) => s.project);
  const speaker = project?.actors.find((a) => a.id === node?.speakerId);

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
          <span>NPC Dialogue</span>
        </div>
        <span className="text-[11px] font-medium text-fw-text truncate max-w-[120px]">
          {speaker ? speaker.name : node?.speakerId ? "Actor" : "No Speaker"}
        </span>
      </div>

      <div className="text-[11px] text-fw-text/90 line-clamp-3 leading-relaxed whitespace-pre-wrap break-words min-h-[1.5rem]">
        {node?.dialogueText || <span className="italic text-fw-muted">Empty dialogue</span>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
