import React from "react";
import { type NodeProps } from "@xyflow/react";
import type { CommentNode as CoreCommentNode } from "@freewrite/core";
import { StickyNote } from "lucide-react";

export function CommentNodeComponent({ data, selected }: NodeProps) {
  const node = (data as { coreNode: CoreCommentNode }).coreNode;

  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded border bg-[#252520] p-2.5 text-xs text-fw-text transition-all ${
        selected ? "border-yellow-400 ring-2 ring-yellow-400/40" : "border-yellow-600/50 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 font-semibold text-yellow-500/90 border-b border-yellow-500/20 pb-1 mb-1.5">
        <StickyNote size={12} />
        <span>Comment</span>
      </div>

      <div className="text-[11px] text-yellow-100/80 italic leading-relaxed whitespace-pre-wrap break-words">
        {node?.text || "Empty comment"}
      </div>
    </div>
  );
}
