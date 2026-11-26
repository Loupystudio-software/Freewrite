import React, { useMemo } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import type {
  CustomField,
  DocumentCategory,
  NarrativeDocument,
  Project,
} from "@freewrite/core";
import { useDocumentStore } from "../../stores/documentStore";
import { useConversationStore } from "../../stores/conversationStore";
import { extractEntityReferences } from "../documents/markdownRenderer";

interface DocumentInspectorProps {
  document: NarrativeDocument;
  project: Project;
}

export function DocumentInspector({ document }: DocumentInspectorProps) {
  const { updateDocument, setViewMode } = useDocumentStore();
  const { openConversation, setSelectedNodeId } = useConversationStore();

  const stats = useMemo(() => {
    const allText = document.sections.map((s) => s.content).join("\n");
    const words = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    const refs = extractEntityReferences(allText);
    return { words, sections: document.sections.length, refs };
  }, [document]);

  const handleAddField = () => {
    const nextFields: CustomField[] = [
      ...(document.fields || []),
      { title: "New Field", type: "Text", value: "" },
    ];
    updateDocument(document.id, { fields: nextFields });
  };

  const handleUpdateField = (idx: number, patch: Partial<CustomField>) => {
    const nextFields = (document.fields || []).map((f, i) =>
      i === idx ? { ...f, ...patch } : f
    );
    updateDocument(document.id, { fields: nextFields });
  };

  const handleRemoveField = (idx: number) => {
    const nextFields = (document.fields || []).filter((_, i) => i !== idx);
    updateDocument(document.id, { fields: nextFields });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <div>
        <label className="text-fw-muted block mb-1">Document Title</label>
        <input
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
          value={document.title}
          onChange={(e) => updateDocument(document.id, { title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-fw-muted block mb-1">Category / Template</label>
        <select
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
          value={document.category}
          onChange={(e) =>
            updateDocument(document.id, {
              category: e.target.value as DocumentCategory,
            })
          }
        >
          <option value="gdd">Game Design Doc (GDD)</option>
          <option value="lore">World & Lore</option>
          <option value="screenplay">Screenplay / Script</option>
          <option value="quest_brief">Quest Brief</option>
          <option value="notes">Design Notes</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-fw-muted block mb-1">Summary / Description</label>
        <textarea
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
          rows={3}
          value={document.description}
          onChange={(e) =>
            updateDocument(document.id, { description: e.target.value })
          }
          placeholder="Brief overview of this document..."
        />
      </div>

      <div>
        <label className="text-fw-muted block mb-1">Tags (comma-separated)</label>
        <input
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
          value={(document.tags || []).join(", ")}
          onChange={(e) =>
            updateDocument(document.id, {
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="chapter-1, main-quest, draft"
        />
      </div>

      <hr className="border-fw-border" />

      {/* Stats */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-fw-muted">Sections:</span>
          <span className="text-fw-text">{stats.sections}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fw-muted">Word Count:</span>
          <span className="text-fw-text">{stats.words}</span>
        </div>
        {document.externalId != null && (
          <div className="flex justify-between">
            <span className="text-fw-muted">External ID:</span>
            <span className="text-fw-muted/80 font-mono">#{document.externalId}</span>
          </div>
        )}
      </div>

      <hr className="border-fw-border" />

      {/* Referenced Entities */}
      <div>
        <div className="flex items-center gap-1 text-fw-muted font-semibold uppercase text-[10px] tracking-wider mb-1.5">
          <Link2 size={11} />
          <span>Referenced Entities ({stats.refs.length})</span>
        </div>
        {stats.refs.length === 0 ? (
          <div className="text-[11px] text-fw-muted/60 italic">
            Use "@ Link Entity" inside any section to reference Actors, Flows, Nodes, Quests, or Variables.
          </div>
        ) : (
          <div className="space-y-1">
            {stats.refs.map((ref, idx) => (
              <button
                key={`${ref.kind}-${idx}`}
                onClick={() => {
                  if (ref.kind === "conv") {
                    openConversation(ref.id);
                    setViewMode("canvas");
                  } else if (ref.kind === "node") {
                    openConversation(ref.id);
                    if (ref.secondaryId) setSelectedNodeId(ref.secondaryId);
                    setViewMode("canvas");
                  }
                }}
                className="w-full flex items-center justify-between px-2 py-1 rounded bg-fw-bg border border-fw-border/60 hover:border-fw-accent text-left transition-colors"
              >
                <span className="truncate text-fw-text">{ref.label}</span>
                <span className="text-[9px] uppercase text-fw-muted ml-2 shrink-0">
                  {ref.kind}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-fw-border" />

      {/* Custom Fields (Articy Template Properties) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-fw-muted font-semibold uppercase text-[10px] tracking-wider">
            Custom Fields
          </span>
          <button
            onClick={handleAddField}
            className="text-fw-accent hover:text-fw-accent-hover flex items-center gap-0.5 text-[11px]"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(document.fields || []).map((field, idx) => (
            <div
              key={idx}
              className="p-2 bg-fw-bg border border-fw-border rounded-sm space-y-1.5"
            >
              <div className="flex items-center gap-1">
                <input
                  value={field.title}
                  onChange={(e) =>
                    handleUpdateField(idx, { title: e.target.value })
                  }
                  className="flex-1 bg-fw-panel border border-fw-border rounded-sm px-1.5 py-0.5 text-[11px] text-fw-text focus:outline-none"
                  placeholder="Field name"
                />
                <button
                  onClick={() => handleRemoveField(idx)}
                  className="text-fw-muted hover:text-fw-error p-0.5"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <input
                value={field.value}
                onChange={(e) =>
                  handleUpdateField(idx, { value: e.target.value })
                }
                className="w-full bg-fw-panel border border-fw-border rounded-sm px-1.5 py-0.5 text-[11px] text-fw-text focus:outline-none"
                placeholder="Value..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
