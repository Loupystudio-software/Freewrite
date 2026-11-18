import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StartNode as CoreStartNode } from "@freewrite/core";
import { Play } from "lucide-react";

export function StartNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreStartNode }).coreNode;

  return (
    <div
      className={`min-w-[180px] rounded border bg-[#1a2a1a] p-2 text-xs text-fw-text transition-all ${
        selected ? "border-green-400 ring-2 ring-green-400/40" : "border-green-600/80 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 font-semibold text-green-400">
        <Play size={12} fill="currentColor" />
        <span className="uppercase tracking-wider">Start</span>
        {node?.label && (
          <span className="ml-auto text-[10px] text-green-300/80 font-normal truncate max-w-[90px]">
            {node.label}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-green-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
