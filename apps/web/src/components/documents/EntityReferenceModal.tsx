import React, { useMemo, useState } from "react";
import { X, Search, Users, MessageSquare, GitBranch, Package, Variable as VarIcon } from "lucide-react";
import type { Project } from "@freewrite/core";

interface EntityReferenceModalProps {
  project: Project;
  onSelect: (token: string) => void;
  onClose: () => void;
}

type FilterTab = "all" | "actor" | "conv" | "node" | "item" | "var";

export function EntityReferenceModal({
  project,
  onSelect,
  onClose,
}: EntityReferenceModalProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: Array<{
      kind: Exclude<FilterTab, "all">;
      label: string;
      subtitle: string;
      token: string;
    }> = [];

    if (tab === "all" || tab === "actor") {
      for (const a of project.actors) {
        if (!q || a.name.toLowerCase().includes(q)) {
          list.push({
            kind: "actor",
            label: a.name,
            subtitle: a.isPlayer ? "Player Actor" : "NPC Actor",
            token: `[[actor:${a.id}|${a.name}]]`,
          });
        }
      }
    }

    if (tab === "all" || tab === "conv") {
      for (const c of project.conversations) {
        if (!q || c.title.toLowerCase().includes(q)) {
          list.push({
            kind: "conv",
            label: c.title,
            subtitle: `${c.nodes.length} nodes`,
            token: `[[conv:${c.id}|${c.title}]]`,
          });
        }
      }
    }

    if (tab === "all" || tab === "node") {
      for (const c of project.conversations) {
        for (const n of c.nodes) {
          let preview = "";
          if (n.type === "dialogue") preview = n.dialogueText;
          else if (n.type === "player_response") preview = n.responseText;
          else if (n.type === "comment") preview = n.text;
          else continue;

          const shortText = preview.slice(0, 48).replace(/\|/g, "/");
          if (
            !q ||
            preview.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q)
          ) {
            list.push({
              kind: "node",
              label: shortText || n.type,
              subtitle: `in "${c.title}" (${n.type})`,
              token: `[[node:${c.id}:${n.id}|${shortText || n.type}]]`,
            });
          }
        }
      }
    }

    if (tab === "all" || tab === "item") {
      for (const it of project.items || []) {
        if (!q || it.name.toLowerCase().includes(q)) {
          list.push({
            kind: "item",
            label: it.name,
            subtitle: it.isItem ? "Item" : "Quest",
            token: `[[item:${it.id}|${it.name}]]`,
          });
        }
      }
    }

    if (tab === "all" || tab === "var") {
      for (const v of project.variables) {
        if (!q || v.name.toLowerCase().includes(q)) {
          list.push({
            kind: "var",
            label: v.name,
            subtitle: `${v.type} = ${String(v.initialValue)}`,
            token: `[[var:${v.id}|${v.name}]]`,
          });
        }
      }
    }

    return list;
  }, [project, query, tab]);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "actor", label: "Actors" },
    { id: "conv", label: "Flows" },
    { id: "node", label: "Nodes" },
    { id: "item", label: "Quests/Items" },
    { id: "var", label: "Variables" },
  ];

  const getIcon = (kind: Exclude<FilterTab, "all">) => {
    switch (kind) {
      case "actor":
        return <Users size={13} className="text-emerald-400" />;
      case "conv":
        return <MessageSquare size={13} className="text-purple-400" />;
      case "node":
        return <GitBranch size={13} className="text-indigo-400" />;
      case "item":
        return <Package size={13} className="text-amber-400" />;
      case "var":
        return <VarIcon size={13} className="text-cyan-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-[92vw] bg-fw-panel border border-fw-border rounded shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-fw-border">
          <span className="text-xs font-semibold text-fw-text uppercase tracking-wider">
            Insert Entity Reference
          </span>
          <button
            onClick={onClose}
            className="text-fw-muted hover:text-fw-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-3 border-b border-fw-border space-y-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fw-muted"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actors, conversations, dialogue nodes, quests, variables..."
              className="w-full bg-fw-bg border border-fw-border rounded pl-8 pr-3 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  tab === t.id
                    ? "bg-fw-accent text-white"
                    : "bg-fw-bg text-fw-muted hover:text-fw-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-fw-border/40">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-xs text-fw-muted">
              No matching entities found in project.
            </div>
          ) : (
            entries.map((entry, idx) => (
              <button
                key={`${entry.kind}-${idx}`}
                onClick={() => {
                  onSelect(entry.token);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-fw-bg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getIcon(entry.kind)}
                  <div className="truncate">
                    <div className="text-xs font-medium text-fw-text truncate">
                      {entry.label}
                    </div>
                    <div className="text-[10px] text-fw-muted truncate">
                      {entry.subtitle}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-fw-accent shrink-0 ml-2">
                  Insert
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
