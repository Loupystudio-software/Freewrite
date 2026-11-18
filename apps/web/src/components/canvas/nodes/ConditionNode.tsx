import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConditionNode as CoreConditionNode } from "@freewrite/core";
import { GitBranch } from "lucide-react";

export function ConditionNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreConditionNode }).coreNode;

  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded border bg-[#2a2010] p-2.5 text-xs text-fw-text transition-all ${
        selected ? "border-amber-400 ring-2 ring-amber-400/40" : "border-amber-500/70 shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#1a1a1a]"
      />

      <div className="flex items-center gap-1.5 font-semibold text-amber-400 border-b border-amber-500/30 pb-1 mb-1.5">
        <GitBranch size={12} />
        <span>Condition</span>
      </div>

      <div className="font-mono text-[11px] bg-black/30 px-1.5 py-1 rounded text-amber-200/90 truncate">
        {node?.expression || <span className="italic text-fw-muted">true</span>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
