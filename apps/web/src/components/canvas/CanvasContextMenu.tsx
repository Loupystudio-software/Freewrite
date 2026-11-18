import React from "react";
import type { AnyDialogueNode } from "@freewrite/core";
import {
  Play,
  MessageSquare,
  UserCheck,
  GitBranch,
  Zap,
  Square,
  StickyNote,
  Maximize2,
} from "lucide-react";

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onAddNode: (type: AnyDialogueNode["type"]) => void;
  onFitView: () => void;
  onClose: () => void;
}

export function CanvasContextMenu({
  x,
  y,
  onAddNode,
  onFitView,
  onClose,
}: CanvasContextMenuProps) {
  const menuItems: {
    type: AnyDialogueNode["type"];
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "start", label: "Start Node", icon: <Play size={13} className="text-green-400" /> },
    { type: "dialogue", label: "NPC Dialogue", icon: <MessageSquare size={13} className="text-blue-400" /> },
    { type: "player_response", label: "Player Response", icon: <UserCheck size={13} className="text-purple-400" /> },
    { type: "condition", label: "Condition Node", icon: <GitBranch size={13} className="text-amber-400" /> },
    { type: "action", label: "Action Node", icon: <Zap size={13} className="text-rose-400" /> },
    { type: "end", label: "End Node", icon: <Square size={13} className="text-red-400" /> },
    { type: "comment", label: "Design Comment", icon: <StickyNote size={13} className="text-yellow-400" /> },
  ];

  return (
    <div
      className="fixed z-50 bg-[#1f1f1f] border border-fw-border rounded shadow-xl py-1 w-48 text-xs select-none"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-fw-muted tracking-wider">
        Create Node
      </div>
      {menuItems.map((item) => (
        <button
          key={item.type}
          onClick={() => {
            onAddNode(item.type);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-fw-bg text-fw-text text-left transition-colors"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      <div className="my-1 border-t border-fw-border" />

      <button
        onClick={() => {
          onFitView();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-fw-bg text-fw-muted hover:text-fw-text text-left transition-colors"
      >
        <Maximize2 size={13} />
        <span>Fit View</span>
      </button>
    </div>
  );
}
