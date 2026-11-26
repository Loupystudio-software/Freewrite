import React from "react";
import type { Project } from "@freewrite/core";

export interface EntityLinkTarget {
  kind: "actor" | "conv" | "node" | "item" | "var" | "loc";
  id: string;
  secondaryId?: string; // e.g., nodeId when kind === "node" and id === convId
  label: string;
}

interface MarkdownRendererProps {
  content: string;
  sectionType?: "text" | "todo" | "table" | "screenplay" | "callout";
  project: Project;
  onToggleTodo?: (lineIndex: number) => void;
  onEntityClick?: (target: EntityLinkTarget) => void;
}

const ENTITY_TOKEN_RE = /\[\[(actor|conv|node|item|var|loc):([^|\]]+)\|([^\]]+)\]\]/g;

function renderInline(
  text: string,
  project: Project,
  onEntityClick?: (target: EntityLinkTarget) => void
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // First split by entity tokens [[kind:id|label]]
  const matches = Array.from(text.matchAll(ENTITY_TOKEN_RE));
  for (const m of matches) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) {
      nodes.push(
        ...renderFormattedText(text.slice(lastIndex, idx), `t-${keyCounter++}`)
      );
    }

    const kind = m[1] as EntityLinkTarget["kind"];
    const rawId = m[2];
    const label = m[3];

    let id = rawId;
    let secondaryId: string | undefined;
    if (kind === "node" && rawId.includes(":")) {
      const [cId, nId] = rawId.split(":");
      id = cId;
      secondaryId = nId;
    }

    let badgeColor = "bg-blue-950/60 text-blue-300 border-blue-700/50 hover:bg-blue-900/70";
    let prefix = "@";
    if (kind === "actor") {
      const actor = project.actors.find((a) => a.id === id);
      badgeColor = "bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/70";
      prefix = actor?.isPlayer ? "PC" : "Actor";
    } else if (kind === "conv") {
      badgeColor = "bg-purple-950/60 text-purple-300 border-purple-700/50 hover:bg-purple-900/70";
      prefix = "Flow";
    } else if (kind === "node") {
      badgeColor = "bg-indigo-950/60 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/70";
      prefix = "Node";
    } else if (kind === "item") {
      badgeColor = "bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/70";
      prefix = "Quest/Item";
    } else if (kind === "var") {
      badgeColor = "bg-cyan-950/60 text-cyan-300 border-cyan-700/50 hover:bg-cyan-900/70";
      prefix = "Var";
    } else if (kind === "loc") {
      badgeColor = "bg-teal-950/60 text-teal-300 border-teal-700/50 hover:bg-teal-900/70";
      prefix = "Location";
    }

    nodes.push(
      <button
        key={`ent-${keyCounter++}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEntityClick?.({ kind, id, secondaryId, label });
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-medium border transition-colors align-baseline ${badgeColor}`}
        title={`Jump to ${prefix}: ${label}`}
      >
        <span className="opacity-65 text-[9px] uppercase tracking-wider">{prefix}</span>
        <span>{label}</span>
      </button>
    );

    lastIndex = idx + m[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderFormattedText(text.slice(lastIndex), `t-${keyCounter++}`));
  }

  return nodes;
}

function renderFormattedText(text: string, keyPrefix: string): React.ReactNode[] {
  // Handle inline `code`, **bold**, *italic*
  const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;

  for (const m of text.matchAll(tokenRe)) {
    const idx = m.index ?? 0;
    if (idx > last) {
      parts.push(text.slice(last, idx));
    }
    const token = m[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${i++}`}
          className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[12px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`${keyPrefix}-i-${i++}`} className="italic text-fw-text/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = idx + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts;
}

export function extractEntityReferences(content: string): EntityLinkTarget[] {
  const results: EntityLinkTarget[] = [];
  const seen = new Set<string>();
  for (const m of content.matchAll(ENTITY_TOKEN_RE)) {
    const kind = m[1] as EntityLinkTarget["kind"];
    const rawId = m[2];
    const label = m[3];
    const key = `${kind}:${rawId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (kind === "node" && rawId.includes(":")) {
      const [cId, nId] = rawId.split(":");
      results.push({ kind, id: cId, secondaryId: nId, label });
    } else {
      results.push({ kind, id: rawId, label });
    }
  }
  return results;
}

export function MarkdownRenderer({
  content,
  sectionType = "text",
  project,
  onToggleTodo,
  onEntityClick,
}: MarkdownRendererProps) {
  if (!content.trim()) {
    return (
      <div className="text-xs text-fw-muted/50 italic py-2">
        Empty section. Click Edit to start writing...
      </div>
    );
  }

  const lines = content.split("\n");

  if (sectionType === "screenplay") {
    return (
      <div className="space-y-2.5 font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Stage direction: (text)
          if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
            return (
              <div
                key={idx}
                className="text-xs italic text-fw-muted pl-6 border-l-2 border-fw-border/60 py-0.5"
              >
                {renderInline(trimmed, project, onEntityClick)}
              </div>
            );
          }

          // Speaker line: NAME: dialogue
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx > 0 && colonIdx < 32) {
            const speakerName = trimmed.slice(0, colonIdx).trim();
            const dialogue = trimmed.slice(colonIdx + 1).trim();
            const matchedActor = project.actors.find(
              (a) => a.name.toLowerCase() === speakerName.toLowerCase()
            );
            const isPlayer =
              speakerName.toUpperCase() === "PLAYER" || matchedActor?.isPlayer;
            const speakerColor =
              matchedActor?.color || (isPlayer ? "#34d399" : "#60a5fa");

            return (
              <div
                key={idx}
                className="bg-fw-bg/70 border border-fw-border/60 rounded px-3 py-2"
              >
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: speakerColor }}
                >
                  {matchedActor ? matchedActor.name : speakerName}
                  {isPlayer && (
                    <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded">
                      PLAYER
                    </span>
                  )}
                </div>
                <div className="text-sm text-fw-text leading-relaxed">
                  {renderInline(dialogue, project, onEntityClick)}
                </div>
              </div>
            );
          }

          return (
            <p key={idx} className="text-sm text-fw-text leading-relaxed">
              {renderInline(trimmed, project, onEntityClick)}
            </p>
          );
        })}
      </div>
    );
  }

  // Standard block parser for Markdown (paragraphs, headings, lists, todos, tables, code blocks, blockquotes)
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre
          key={`pre-${i}`}
          className="bg-black/50 border border-fw-border rounded p-2.5 text-xs font-mono text-emerald-300 overflow-x-auto my-2"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Markdown table
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const parseRow = (row: string) =>
        row
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(tableLines[0]);
      const isSeparator = (row: string) => /^\|?[\s:-]+\|/.test(row);
      const bodyStart = tableLines.length > 1 && isSeparator(tableLines[1]) ? 2 : 1;
      const bodyRows = tableLines.slice(bodyStart).map(parseRow);

      blocks.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-2 rounded border border-fw-border">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-fw-bg/90 text-fw-muted uppercase text-[11px]">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-1.5 border-b border-fw-border font-semibold">
                    {renderInline(h, project, onEntityClick)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fw-border/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-fw-bg/40">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-fw-text">
                      {renderInline(row[cIdx] ?? "", project, onEntityClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-sm font-semibold text-fw-text mt-3 mb-1">
          {renderInline(trimmed.slice(4), project, onEntityClick)}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3 key={`h2-${i}`} className="text-base font-semibold text-white mt-3 mb-1">
          {renderInline(trimmed.slice(3), project, onEntityClick)}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold text-white mt-3 mb-1.5">
          {renderInline(trimmed.slice(2), project, onEntityClick)}
        </h2>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      blocks.push(<hr key={`hr-${i}`} className="border-fw-border my-3" />);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-2 border-fw-accent pl-3 py-0.5 text-sm text-fw-muted italic my-1.5"
        >
          {renderInline(trimmed.slice(2), project, onEntityClick)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Todo list item (- [ ] or - [x])
    const todoMatch = trimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (todoMatch) {
      const lineIdx = i;
      const checked = todoMatch[1].toLowerCase() === "x";
      const label = todoMatch[2];
      blocks.push(
        <label
          key={`todo-${i}`}
          className="flex items-start gap-2 py-0.5 text-sm cursor-pointer group select-none"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleTodo?.(lineIdx)}
            className="mt-1 rounded border-fw-border bg-fw-bg text-fw-accent focus:ring-0 cursor-pointer"
          />
          <span
            className={
              checked
                ? "line-through text-fw-muted/70"
                : "text-fw-text group-hover:text-white"
            }
          >
            {renderInline(label, project, onEntityClick)}
          </span>
        </label>
      );
      i++;
      continue;
    }

    // Bullet list item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push(
        <div key={`ul-${i}`} className="flex items-start gap-2 text-sm text-fw-text pl-2 py-0.5">
          <span className="text-fw-accent mt-0.5">•</span>
          <span className="leading-relaxed">
            {renderInline(trimmed.slice(2), project, onEntityClick)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list item
    const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      blocks.push(
        <div key={`ol-${i}`} className="flex items-start gap-2 text-sm text-fw-text pl-2 py-0.5">
          <span className="text-fw-muted font-mono text-xs mt-0.5">{numMatch[1]}</span>
          <span className="leading-relaxed">
            {renderInline(numMatch[2], project, onEntityClick)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Default paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-sm text-fw-text leading-relaxed my-1">
        {renderInline(trimmed, project, onEntityClick)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{blocks}</div>;
}
