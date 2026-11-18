import React from "react";
import type { AnyDialogueNode } from "@freewrite/core";
import { useConversationStore } from "../../stores/conversationStore";
import {
  Play,
  MessageSquare,
  UserCheck,
  GitBranch,
  Zap,
  Square,
  StickyNote,
} from "lucide-react";

interface NodeToolbarProps {
  onAddNode: (type: AnyDialogueNode["type"]) => void;
}

export function NodeToolbar({ onAddNode }: NodeToolbarProps) {
  const buttons: {
    type: AnyDialogueNode["type"];
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: "start",
      label: "Start",
      icon: <Play size={12} fill="currentColor" />,
      color: "hover:bg-green-500/20 hover:text-green-400 border-green-700/40",
    },
    {
      type: "dialogue",
      label: "Dialogue",
      icon: <MessageSquare size={12} />,
      color: "hover:bg-blue-500/20 hover:text-blue-400 border-blue-700/40",
    },
    {
      type: "player_response",
      label: "Response",
      icon: <UserCheck size={12} />,
      color: "hover:bg-purple-500/20 hover:text-purple-400 border-purple-700/40",
    },
    {
      type: "condition",
      label: "Condition",
      icon: <GitBranch size={12} />,
      color: "hover:bg-amber-500/20 hover:text-amber-400 border-amber-700/40",
    },
    {
      type: "action",
      label: "Action",
      icon: <Zap size={12} />,
      color: "hover:bg-rose-500/20 hover:text-rose-400 border-rose-700/40",
    },
    {
      type: "end",
      label: "End",
      icon: <Square size={12} fill="currentColor" />,
      color: "hover:bg-red-500/20 hover:text-red-400 border-red-700/40",
    },
    {
      type: "comment",
      label: "Comment",
      icon: <StickyNote size={12} />,
      color: "hover:bg-yellow-500/20 hover:text-yellow-400 border-yellow-700/40",
    },
  ];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#1f1f1f]/90 backdrop-blur border border-fw-border rounded p-1 shadow-lg">
      <span className="text-[11px] font-semibold text-fw-muted uppercase px-2 tracking-wider">
        Add
      </span>
      {buttons.map((b) => (
        <button
          key={b.type}
          onClick={() => onAddNode(b.type)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs text-fw-text rounded border transition-colors ${b.color}`}
          title={`Add ${b.label} node`}
        >
          {b.icon}
          <span>{b.label}</span>
        </button>
      ))}
    </div>
  );
}
