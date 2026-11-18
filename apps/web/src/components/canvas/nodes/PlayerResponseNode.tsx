import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PlayerResponseNode as CorePlayerResponseNode } from "@freewrite/core";
import { UserCheck } from "lucide-react";

export function PlayerResponseNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CorePlayerResponseNode }).coreNode;

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded border bg-[#2a1e33] p-2.5 text-xs text-fw-text transition-all ${
        selected ? "border-purple-400 ring-2 ring-purple-400/40" : "border-purple-500/70 shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-[#1a1a1a]"
      />

      <div className="flex items-center justify-between border-b border-purple-500/30 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-purple-400">
          <UserCheck size={12} />
          <span>Player Choice</span>
        </div>
        {node?.menuText && (
          <span className="text-[10px] text-purple-300/80 truncate max-w-[100px]">
            [{node.menuText}]
          </span>
        )}
      </div>

      <div className="text-[11px] text-fw-text/90 line-clamp-3 leading-relaxed whitespace-pre-wrap break-words min-h-[1.5rem]">
        {node?.responseText || <span className="italic text-fw-muted">Empty response</span>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-[#1a1a1a]"
      />
    </div>
  );
}
