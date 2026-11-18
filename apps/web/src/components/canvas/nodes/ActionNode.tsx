import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ActionNode as CoreActionNode } from "@freewrite/core";
import { Zap } from "lucide-react";

export function ActionNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreActionNode }).coreNode;

  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded border bg-[#2a1a1a] p-2.5 text-xs text-fw-text transition-all ${
        selected ? "border-rose-400 ring-2 ring-rose-400/40" : "border-rose-500/70 shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-[#1a1a1a]"
      />

      <div className="flex items-center gap-1.5 font-semibold text-rose-400 border-b border-rose-500/30 pb-1 mb-1.5">
        <Zap size={12} />
        <span>Action</span>
      </div>

      <div className="font-mono text-[11px] bg-black/30 px-1.5 py-1 rounded text-rose-200/90 truncate">
        {node?.actionType || <span className="italic text-fw-muted">custom_action</span>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
