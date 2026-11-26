import React, { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AtSign,
  Eye,
  Edit3,
  Columns,
  ListTree,
  CheckSquare,
  Table as TableIcon,
  Clapperboard,
  FileText,
  AlertCircle,
  GitBranch,
  ChevronsUpDown,
} from "lucide-react";
import type {
  DocumentSection,
  DocumentSectionType,
  NarrativeDocument,
  Project,
} from "@freewrite/core";
import { useDocumentStore } from "../../stores/documentStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useLocationStore } from "../../stores/locationStore";
import { useProjectStore } from "../../stores/projectStore";
import { collaborationManager } from "../../features/collaboration/collaborationManager";
import { MarkdownRenderer, type EntityLinkTarget } from "./markdownRenderer";
import { EntityReferenceModal } from "./EntityReferenceModal";
import { convertSectionToConversation } from "./convertToFlow";

interface DocumentEditorProps {
  document: NarrativeDocument;
  project: Project;
}

type EditorMode = "edit" | "split" | "present";

const SECTION_TYPE_META: Record<
  DocumentSectionType,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  text: {
    label: "Text",
    icon: <FileText size={12} />,
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  },
  todo: {
    label: "Checklist",
    icon: <CheckSquare size={12} />,
    badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
  },
  table: {
    label: "Table",
    icon: <TableIcon size={12} />,
    badgeClass: "bg-cyan-950/60 text-cyan-300 border-cyan-800/60",
  },
  screenplay: {
    label: "Screenplay",
    icon: <Clapperboard size={12} />,
    badgeClass: "bg-purple-950/60 text-purple-300 border-purple-800/60",
  },
  callout: {
    label: "Callout",
    icon: <AlertCircle size={12} />,
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-800/60",
  },
};

export function DocumentEditor({ document, project }: DocumentEditorProps) {
  const {
    activeSectionId,
    setActiveSectionId,
    updateDocument,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    toggleSectionCollapse,
    collapseAllSections,
    setViewMode,
  } = useDocumentStore();

  const { openConversation, setSelectedNodeId } = useConversationStore();
  const { openLocation } = useLocationStore();
  const { addConversation } = useProjectStore();

  const [mode, setMode] = useState<EditorMode>("split");
  const [showOutline, setShowOutline] = useState(true);
  const [refTargetSectionId, setRefTargetSectionId] = useState<string | null>(null);
  const [convertedBanner, setConvertedBanner] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const allCollapsed =
    document.sections.length > 0 && document.sections.every((s) => s.collapsed);

  const handleScrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleInsertSnippet = (sectionId: string, snippet: string) => {
    const section = document.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const ta = textareaRefs.current[sectionId];
    if (ta) {
      const start = ta.selectionStart ?? section.content.length;
      const end = ta.selectionEnd ?? section.content.length;
      const nextContent =
        section.content.slice(0, start) + snippet + section.content.slice(end);
      updateSection(document.id, sectionId, { content: nextContent });
      requestAnimationFrame(() => {
        ta.focus();
        const cursor = start + snippet.length;
        ta.setSelectionRange(cursor, cursor);
      });
    } else {
      updateSection(document.id, sectionId, {
        content: section.content ? `${section.content}\n${snippet}` : snippet,
      });
    }
  };

  const handleToggleTodoLine = (section: DocumentSection, lineIndex: number) => {
    const lines = section.content.split("\n");
    const target = lines[lineIndex];
    if (!target) return;
    if (/^(\s*[-*]\s+)\[ \]/.test(target)) {
      lines[lineIndex] = target.replace(/^(\s*[-*]\s+)\[ \]/, "$1[x]");
    } else if (/^(\s*[-*]\s+)\[(x|X)\]/.test(target)) {
      lines[lineIndex] = target.replace(/^(\s*[-*]\s+)\[(x|X)\]/, "$1[ ]");
    }
    updateSection(document.id, section.id, { content: lines.join("\n") });
  };

  const handleEntityClick = (target: EntityLinkTarget) => {
    if (target.kind === "conv") {
      openConversation(target.id);
      setViewMode("canvas");
    } else if (target.kind === "node") {
      openConversation(target.id);
      if (target.secondaryId) {
        setSelectedNodeId(target.secondaryId);
      }
      setViewMode("canvas");
    } else if (target.kind === "loc") {
      openLocation(target.id);
    }
  };

  const handleConvertToFlow = (section: DocumentSection) => {
    const conv = convertSectionToConversation(
      section.title || document.title,
      section.content,
      project
    );
    addConversation(conv);
    const updatedProject = useProjectStore.getState().project;
    if (updatedProject) {
      collaborationManager.syncFullProject(updatedProject);
    }
    setConvertedBanner(`Converted "${section.title}" to Flow "${conv.title}" (${conv.nodes.length} nodes).`);
    openConversation(conv.id);
    setViewMode("canvas");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-fw-bg overflow-hidden select-text">
      {/* Document Top Toolbar */}
      <div className="h-11 bg-fw-panel border-b border-fw-border px-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setShowOutline((v) => !v)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showOutline
                ? "bg-fw-bg text-fw-accent"
                : "text-fw-muted hover:text-fw-text hover:bg-fw-bg"
            }`}
            title="Toggle Document Outline"
          >
            <ListTree size={15} />
          </button>

          <input
            value={document.title}
            onChange={(e) =>
              updateDocument(document.id, { title: e.target.value })
            }
            className="bg-transparent text-sm font-semibold text-white focus:outline-none focus:bg-fw-bg px-2 py-1 rounded border border-transparent focus:border-fw-border min-w-[160px] flex-1 max-w-md"
            placeholder="Document Title"
          />

          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-fw-bg border border-fw-border text-fw-muted shrink-0">
            {document.category.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-fw-bg border border-fw-border rounded p-0.5 text-xs">
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                mode === "edit"
                  ? "bg-fw-accent text-white"
                  : "text-fw-muted hover:text-fw-text"
              }`}
              title="Edit Mode"
            >
              <Edit3 size={12} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setMode("split")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                mode === "split"
                  ? "bg-fw-accent text-white"
                  : "text-fw-muted hover:text-fw-text"
              }`}
              title="Split Edit & Preview"
            >
              <Columns size={12} />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setMode("present")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                mode === "present"
                  ? "bg-fw-accent text-white"
                  : "text-fw-muted hover:text-fw-text"
              }`}
              title="Presentation / Reader Mode"
            >
              <Eye size={12} />
              <span className="hidden sm:inline">Present</span>
            </button>
          </div>

          <button
            onClick={() => collapseAllSections(document.id, !allCollapsed)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-fw-muted hover:text-fw-text bg-fw-bg border border-fw-border rounded transition-colors"
            title={allCollapsed ? "Expand All Sections" : "Collapse All Sections"}
          >
            <ChevronsUpDown size={13} />
            <span className="hidden md:inline">
              {allCollapsed ? "Expand All" : "Collapse All"}
            </span>
          </button>

          <button
            onClick={() => addSection(document.id, { type: "text" })}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-fw-accent hover:bg-fw-accent-hover text-white rounded transition-colors"
            title="Add New Section"
          >
            <Plus size={13} />
            <span>Section</span>
          </button>
        </div>
      </div>

      {convertedBanner && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/60 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{convertedBanner}</span>
          <button
            onClick={() => setConvertedBanner(null)}
            className="text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace: Outline + Modular Sections */}
      <div className="flex-1 flex overflow-hidden">
        {/* Outline / Table of Contents */}
        {showOutline && (
          <div className="w-52 bg-fw-panel/60 border-r border-fw-border flex flex-col shrink-0 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-fw-muted border-b border-fw-border/60">
              Document Outline ({document.sections.length})
            </div>
            <div className="p-1.5 space-y-0.5 flex-1">
              {document.sections.length === 0 ? (
                <div className="text-[11px] text-fw-muted/60 px-2 py-3 text-center">
                  No sections yet
                </div>
              ) : (
                document.sections.map((sec) => {
                  const isSelected = sec.id === activeSectionId;
                  const indent =
                    sec.level === 1 ? "pl-2" : sec.level === 2 ? "pl-5" : "pl-8";
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleScrollToSection(sec.id)}
                      className={`w-full flex items-center gap-1.5 ${indent} pr-2 py-1 rounded text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-fw-bg text-fw-accent font-medium"
                          : "text-fw-muted hover:text-fw-text hover:bg-fw-bg/50"
                      }`}
                    >
                      {sec.collapsed ? (
                        <ChevronRight size={11} className="shrink-0 opacity-60" />
                      ) : (
                        <ChevronDown size={11} className="shrink-0 opacity-60" />
                      )}
                      <span className="truncate flex-1">
                        {sec.title || "Untitled Section"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Add Section Types */}
            <div className="p-2 border-t border-fw-border/60 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-fw-muted px-1 mb-1">
                Quick Insert
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() =>
                    addSection(document.id, {
                      title: "Action Checklist",
                      type: "todo",
                    })
                  }
                  className="flex items-center gap-1 px-1.5 py-1 text-[11px] bg-fw-bg border border-fw-border rounded text-fw-muted hover:text-fw-text"
                >
                  <CheckSquare size={11} /> Todo
                </button>
                <button
                  onClick={() =>
                    addSection(document.id, {
                      title: "Data Table",
                      type: "table",
                    })
                  }
                  className="flex items-center gap-1 px-1.5 py-1 text-[11px] bg-fw-bg border border-fw-border rounded text-fw-muted hover:text-fw-text"
                >
                  <TableIcon size={11} /> Table
                </button>
                <button
                  onClick={() =>
                    addSection(document.id, {
                      title: "Scene Dialogue",
                      type: "screenplay",
                    })
                  }
                  className="flex items-center gap-1 px-1.5 py-1 text-[11px] bg-fw-bg border border-fw-border rounded text-purple-300 hover:text-purple-200 col-span-2"
                >
                  <Clapperboard size={11} /> Screenplay / Script
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Page Canvas */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-4 pb-20">
            {document.sections.length === 0 ? (
              <div className="border border-dashed border-fw-border rounded-lg p-10 text-center">
                <div className="text-sm text-fw-muted mb-3">
                  This document has no chapters or sections yet.
                </div>
                <button
                  onClick={() => addSection(document.id, { title: "Chapter 1" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fw-accent text-white rounded text-xs hover:bg-fw-accent-hover"
                >
                  <Plus size={14} /> Add First Section
                </button>
              </div>
            ) : (
              document.sections.map((section, idx) => {
                const isSelected = section.id === activeSectionId;
                const typeMeta = SECTION_TYPE_META[section.type] || SECTION_TYPE_META.text;
                const levelIndent =
                  section.level === 1
                    ? ""
                    : section.level === 2
                    ? "ml-4"
                    : "ml-8";
                const titleSize =
                  section.level === 1
                    ? "text-base font-bold"
                    : section.level === 2
                    ? "text-sm font-semibold"
                    : "text-xs font-semibold uppercase tracking-wide";

                return (
                  <div
                    key={section.id}
                    ref={(el) => {
                      sectionRefs.current[section.id] = el;
                    }}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`${levelIndent} rounded-md border transition-colors ${
                      section.type === "callout"
                        ? "bg-amber-950/15 border-amber-800/50"
                        : "bg-fw-panel border-fw-border"
                    } ${isSelected ? "ring-1 ring-fw-accent/60" : ""}`}
                  >
                    {/* Collapsible Section Header (Articy:Draft style: click title/bar to collapse) */}
                    <div
                      onClick={() =>
                        toggleSectionCollapse(document.id, section.id)
                      }
                      className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-fw-bg/40 rounded-t-md select-none"
                      title="Click to collapse or expand section"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {section.collapsed ? (
                          <ChevronRight size={15} className="text-fw-muted shrink-0" />
                        ) : (
                          <ChevronDown size={15} className="text-fw-muted shrink-0" />
                        )}

                        {mode === "present" ? (
                          <span className={`${titleSize} text-white truncate`}>
                            {section.title || "Untitled Section"}
                          </span>
                        ) : (
                          <input
                            value={section.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateSection(document.id, section.id, {
                                title: e.target.value,
                              })
                            }
                            className={`bg-transparent ${titleSize} text-white focus:outline-none focus:bg-fw-bg px-1.5 py-0.5 rounded min-w-[120px] flex-1`}
                            placeholder="Section title..."
                          />
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border shrink-0 ${typeMeta.badgeClass}`}
                        >
                          {typeMeta.icon}
                          <span>{typeMeta.label}</span>
                        </span>
                      </div>

                      {/* Section Actions */}
                      {mode !== "present" && (
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={section.level}
                            onChange={(e) =>
                              updateSection(document.id, section.id, {
                                level: Number(e.target.value),
                              })
                            }
                            className="bg-fw-bg border border-fw-border rounded text-[10px] text-fw-muted px-1 py-0.5 focus:outline-none"
                            title="Heading Level"
                          >
                            <option value={1}>H1</option>
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                          </select>

                          <select
                            value={section.type}
                            onChange={(e) =>
                              updateSection(document.id, section.id, {
                                type: e.target.value as DocumentSectionType,
                              })
                            }
                            className="bg-fw-bg border border-fw-border rounded text-[10px] text-fw-muted px-1 py-0.5 focus:outline-none"
                            title="Section Type"
                          >
                            <option value="text">Text</option>
                            <option value="todo">Checklist</option>
                            <option value="table">Table</option>
                            <option value="screenplay">Screenplay</option>
                            <option value="callout">Callout</option>
                          </select>

                          {section.type === "screenplay" && (
                            <button
                              onClick={() => handleConvertToFlow(section)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-950/70 text-purple-300 border border-purple-700/60 hover:bg-purple-900/80 transition-colors"
                              title="Articy Convert-to-Flow: Create a branching Conversation from this script"
                            >
                              <GitBranch size={11} />
                              <span>To Flow</span>
                            </button>
                          )}

                          <button
                            onClick={() => moveSection(document.id, section.id, "up")}
                            disabled={idx === 0}
                            className="p-1 text-fw-muted hover:text-fw-text disabled:opacity-30"
                            title="Move Section Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveSection(document.id, section.id, "down")}
                            disabled={idx === document.sections.length - 1}
                            className="p-1 text-fw-muted hover:text-fw-text disabled:opacity-30"
                            title="Move Section Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete section "${section.title || "Untitled"}"?`
                                )
                              ) {
                                removeSection(document.id, section.id);
                              }
                            }}
                            className="p-1 text-fw-muted hover:text-fw-error"
                            title="Delete Section"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section Body (Hidden when collapsed) */}
                    {!section.collapsed && (
                      <div className="border-t border-fw-border/60">
                        {/* Formatting & Entity Linking Bar in Edit/Split */}
                        {mode !== "present" && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-fw-bg/50 border-b border-fw-border/40 text-[11px] text-fw-muted flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertSnippet(section.id, "**bold** ")
                              }
                              className="px-1.5 py-0.5 hover:text-fw-text hover:bg-fw-panel rounded font-bold"
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertSnippet(section.id, "*italic* ")
                              }
                              className="px-1.5 py-0.5 hover:text-fw-text hover:bg-fw-panel rounded italic"
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertSnippet(section.id, "\n- [ ] Task item")
                              }
                              className="px-1.5 py-0.5 hover:text-fw-text hover:bg-fw-panel rounded flex items-center gap-1"
                              title="Insert Checklist Item"
                            >
                              <CheckSquare size={11} /> Todo
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertSnippet(
                                  section.id,
                                  "\n| Col 1 | Col 2 |\n| --- | --- |\n| A | B |"
                                )
                              }
                              className="px-1.5 py-0.5 hover:text-fw-text hover:bg-fw-panel rounded flex items-center gap-1"
                              title="Insert Markdown Table"
                            >
                              <TableIcon size={11} /> Table
                            </button>
                            <button
                              type="button"
                              onClick={() => setRefTargetSectionId(section.id)}
                              className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-fw-panel border border-fw-border rounded text-fw-accent hover:text-white hover:border-fw-accent transition-colors"
                              title="Link Actor, Conversation, Node, Quest, or Variable"
                            >
                              <AtSign size={11} />
                              <span>Link Entity</span>
                            </button>
                          </div>
                        )}

                        <div
                          className={`grid ${
                            mode === "split"
                              ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-fw-border/60"
                              : "grid-cols-1"
                          }`}
                        >
                          {mode !== "present" && (
                            <div className="p-3">
                              <textarea
                                ref={(el) => {
                                  textareaRefs.current[section.id] = el;
                                }}
                                value={section.content}
                                onChange={(e) =>
                                  updateSection(document.id, section.id, {
                                    content: e.target.value,
                                  })
                                }
                                rows={Math.max(
                                  4,
                                  Math.min(18, section.content.split("\n").length + 1)
                                )}
                                placeholder={
                                  section.type === "screenplay"
                                    ? "GUARD: Halt! Who goes there?\n(The guard raises his lantern.)\nPLAYER: Just passing through."
                                    : "Write Markdown content here..."
                                }
                                className="w-full bg-fw-bg/60 border border-fw-border/60 rounded p-2.5 text-xs font-mono text-fw-text focus:outline-none focus:border-fw-accent resize-y leading-relaxed"
                              />
                            </div>
                          )}

                          {(mode === "split" || mode === "present") && (
                            <div className="p-4 bg-fw-panel/40">
                              <MarkdownRenderer
                                content={section.content}
                                sectionType={section.type}
                                project={project}
                                onToggleTodo={(lineIdx) =>
                                  handleToggleTodoLine(section, lineIdx)
                                }
                                onEntityClick={handleEntityClick}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Add Section Footer */}
            {mode !== "present" && document.sections.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => addSection(document.id, { type: "text" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-fw-panel border border-fw-border rounded hover:border-fw-accent text-fw-muted hover:text-fw-text transition-colors"
                >
                  <Plus size={13} /> Add Text Section
                </button>
                <button
                  onClick={() =>
                    addSection(document.id, {
                      title: "New Scene",
                      type: "screenplay",
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-fw-panel border border-fw-border rounded hover:border-purple-500 text-purple-300/90 hover:text-purple-200 transition-colors"
                >
                  <Clapperboard size={13} /> Add Screenplay Scene
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entity Reference Picker Modal */}
      {refTargetSectionId && (
        <EntityReferenceModal
          project={project}
          onSelect={(token) => handleInsertSnippet(refTargetSectionId, token)}
          onClose={() => setRefTargetSectionId(null)}
        />
      )}
    </div>
  );
}
