import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type Item,
  type ItemQuestState,
  type CustomField,
  type CustomFieldType,
} from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";
import {
  Compass,
  Package,
  Plus,
  Trash2,
  X,
  Search,
  FileText,
  CheckCircle,
} from "lucide-react";

interface Props {
  onClose: () => void;
}

const QUEST_STATES: ItemQuestState[] = [
  "unassigned",
  "active",
  "success",
  "failure",
  "abandoned",
];

export function QuestsModal({ onClose }: Props) {
  const { project, addItem, updateItem, removeItem } = useProjectStore();
  const items = project?.items || [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items.length > 0 ? items[0].id : null
  );
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find((it) => it.id === selectedItemId);

  const handleCreateItem = (isItem: boolean) => {
    const nextExtId =
      items.reduce((max, it) => Math.max(max, it.externalId ?? 0), 0) + 1;
    const newItem: Item = {
      id: uuidv4(),
      externalId: nextExtId,
      name: isItem ? `Item ${nextExtId}` : `Quest ${nextExtId}`,
      isItem,
      state: "unassigned",
      description: "",
      successDescription: "",
      failureDescription: "",
      fields: [],
      metadata: {},
    };
    addItem(newItem);
    setSelectedItemId(newItem.id);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      removeItem(id);
      if (selectedItemId === id) {
        const remaining = items.filter((it) => it.id !== id);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleAddField = () => {
    if (!selectedItem) return;
    const newFields = [
      ...(selectedItem.fields || []),
      { title: "New Field", type: "Text" as CustomFieldType, value: "" },
    ];
    updateItem(selectedItem.id, { fields: newFields });
  };

  const handleUpdateField = (index: number, patch: Partial<CustomField>) => {
    if (!selectedItem) return;
    const updated = [...(selectedItem.fields || [])];
    updated[index] = { ...updated[index], ...patch };
    updateItem(selectedItem.id, { fields: updated });
  };

  const handleDeleteField = (index: number) => {
    if (!selectedItem) return;
    const updated = (selectedItem.fields || []).filter((_, i) => i !== index);
    updateItem(selectedItem.id, { fields: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-fw-panel border border-fw-border rounded-lg shadow-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden text-fw-text animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fw-border bg-fw-bg/40">
          <div className="flex items-center gap-2">
            <Compass className="text-amber-400" size={18} />
            <h2 className="text-sm font-semibold">Quests & Items (DS4U)</h2>
            <span className="text-xs text-fw-muted">
              ({items.length} {items.length === 1 ? "entry" : "entries"})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fw-muted hover:text-fw-text rounded hover:bg-fw-border transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: List */}
          <div className="w-64 border-r border-fw-border flex flex-col bg-fw-panel/60">
            <div className="p-2 border-b border-fw-border flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fw-muted"
                />
                <input
                  type="text"
                  placeholder="Search quests & items…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-fw-bg border border-fw-border rounded pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-fw-accent"
                />
              </div>
              <button
                onClick={() => handleCreateItem(false)}
                className="flex items-center gap-1 px-1.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded text-[10px] font-medium transition-colors"
                title="Add New Quest"
              >
                <Compass size={11} /> +Quest
              </button>
              <button
                onClick={() => handleCreateItem(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-sky-700/80 hover:bg-sky-700 text-white rounded text-[10px] font-medium transition-colors"
                title="Add New Item"
              >
                <Package size={11} /> +Item
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-fw-muted">
                  {search ? "No matching entries." : "No quests or items yet."}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-amber-950/40 border border-amber-600/80 text-white"
                          : "hover:bg-fw-bg/60 border border-transparent text-fw-text"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.isItem ? (
                          <Package size={13} className="text-sky-400 shrink-0" />
                        ) : (
                          <Compass size={13} className="text-amber-400 shrink-0" />
                        )}
                        <span className="text-xs truncate font-medium">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-fw-muted shrink-0 font-mono">
                        {item.state}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Entry Editor */}
          <div className="flex-1 flex flex-col bg-fw-bg/30 overflow-y-auto p-5">
            {!selectedItem ? (
              <div className="flex-1 flex flex-col items-center justify-center text-fw-muted text-xs gap-2">
                <Compass size={32} className="opacity-30" />
                <span>Select a quest/item or click "+Quest" / "+Item" to create one.</span>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {/* Header row */}
                <div className="flex items-center justify-between pb-3 border-b border-fw-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-fw-panel border border-fw-border flex items-center justify-center text-white shadow">
                      {selectedItem.isItem ? (
                        <Package size={20} className="text-sky-400" />
                      ) : (
                        <Compass size={20} className="text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold leading-tight">
                        {selectedItem.name}
                      </h3>
                      <span className="text-[11px] text-fw-muted font-mono">
                        Type: {selectedItem.isItem ? "Item" : "Quest"} • DS4U ID:{" "}
                        {selectedItem.externalId ?? "Auto"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteItem(selectedItem.id, selectedItem.name)
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/40 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedItem.name}
                      onChange={(e) =>
                        updateItem(selectedItem.id, { name: e.target.value })
                      }
                      className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                      Quest State (Lua: GetQuestState)
                    </label>
                    <select
                      value={selectedItem.state}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          state: e.target.value as ItemQuestState,
                        })
                      }
                      className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
                    >
                      {QUEST_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={selectedItem.description}
                    onChange={(e) =>
                      updateItem(selectedItem.id, { description: e.target.value })
                    }
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
                  />
                </div>

                {!selectedItem.isItem && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                        Success Description
                      </label>
                      <textarea
                        rows={2}
                        value={selectedItem.successDescription}
                        onChange={(e) =>
                          updateItem(selectedItem.id, {
                            successDescription: e.target.value,
                          })
                        }
                        className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                        Failure Description
                      </label>
                      <textarea
                        rows={2}
                        value={selectedItem.failureDescription}
                        onChange={(e) =>
                          updateItem(selectedItem.id, {
                            failureDescription: e.target.value,
                          })
                        }
                        className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Custom User Fields */}
                <div className="pt-2 border-t border-fw-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={13} />
                      Custom Fields (DS4U)
                    </span>
                    <button
                      onClick={handleAddField}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-fw-panel border border-fw-border rounded hover:bg-fw-bg text-fw-accent transition-colors"
                    >
                      <Plus size={11} />
                      Add Field
                    </button>
                  </div>

                  {(!selectedItem.fields || selectedItem.fields.length === 0) ? (
                    <div className="text-[11px] text-fw-muted py-2 italic bg-fw-panel/40 px-3 rounded border border-dashed border-fw-border">
                      No custom fields. Click "Add Field" to attach custom quest trackers or item stats.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedItem.fields.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-fw-panel border border-fw-border rounded"
                        >
                          <input
                            type="text"
                            value={f.title}
                            placeholder="Field Name"
                            onChange={(e) =>
                              handleUpdateField(idx, { title: e.target.value })
                            }
                            className="flex-1 bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs focus:outline-none focus:border-fw-accent"
                          />
                          <select
                            value={f.type}
                            onChange={(e) =>
                              handleUpdateField(idx, {
                                type: e.target.value as CustomFieldType,
                              })
                            }
                            className="bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs focus:outline-none focus:border-fw-accent"
                          >
                            <option value="Text">Text</option>
                            <option value="Number">Number</option>
                            <option value="Boolean">Boolean</option>
                            <option value="Files">Files</option>
                          </select>
                          <input
                            type="text"
                            value={f.value}
                            placeholder="Value"
                            onChange={(e) =>
                              handleUpdateField(idx, { value: e.target.value })
                            }
                            className="flex-1 bg-fw-bg border border-fw-border rounded px-2 py-1 text-xs focus:outline-none focus:border-fw-accent font-mono"
                          />
                          <button
                            onClick={() => handleDeleteField(idx)}
                            className="p-1 text-fw-muted hover:text-red-400 transition-colors"
                            title="Remove field"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
