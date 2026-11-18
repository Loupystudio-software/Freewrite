import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { EndNode as CoreEndNode } from "@freewrite/core";
import { Square } from "lucide-react";

export function EndNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreEndNode }).coreNode;

  return (
    <div
      className={`min-w-[180px] rounded border bg-[#2a1a1a] p-2 text-xs text-fw-text transition-all ${
        selected ? "border-red-400 ring-2 ring-red-400/40" : "border-red-600/80 shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-red-400 !border-2 !border-[#1a1a1a]"
      />

      <div className="flex items-center gap-1.5 font-semibold text-red-400">
        <Square size={12} fill="currentColor" />
        <span className="uppercase tracking-wider">End</span>
        {node?.label && (
          <span className="ml-auto text-[10px] text-red-300/80 font-normal truncate max-w-[90px]">
            {node.label}
          </span>
        )}
      </div>
    </div>
  );
}
