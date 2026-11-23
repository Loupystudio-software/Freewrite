import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type Actor,
  type CustomField,
  type CustomFieldType,
} from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";
import {
  Users,
  Plus,
  Trash2,
  X,
  User,
  Shield,
  Search,
  Palette,
  FileText,
} from "lucide-react";

interface Props {
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
];

export function ActorsModal({ onClose }: Props) {
  const { project, addActor, updateActor, removeActor } = useProjectStore();
  const actors = project?.actors || [];

  const [selectedActorId, setSelectedActorId] = useState<string | null>(
    actors.length > 0 ? actors[0].id : null
  );
  const [search, setSearch] = useState("");

  const filteredActors = actors.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedActor = actors.find((a) => a.id === selectedActorId);

  const handleCreateActor = () => {
    const nextExtId =
      actors.reduce((max, a) => Math.max(max, a.externalId ?? 0), 0) + 1;
    const newActor: Actor = {
      id: uuidv4(),
      externalId: nextExtId,
      name: `Actor ${nextExtId}`,
      description: "",
      isPlayer: false,
      pictures: [],
      portrait: null,
      color: PRESET_COLORS[(actors.length) % PRESET_COLORS.length],
      fields: [],
      metadata: {},
    };
    addActor(newActor);
    setSelectedActorId(newActor.id);
  };

  const handleDeleteActor = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete actor "${name}"?`)) {
      removeActor(id);
      if (selectedActorId === id) {
        const remaining = actors.filter((a) => a.id !== id);
        setSelectedActorId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleAddField = () => {
    if (!selectedActor) return;
    const newFields = [
      ...(selectedActor.fields || []),
      { title: "New Field", type: "Text" as CustomFieldType, value: "" },
    ];
    updateActor(selectedActor.id, { fields: newFields });
  };

  const handleUpdateField = (
    index: number,
    patch: Partial<CustomField>
  ) => {
    if (!selectedActor) return;
    const updated = [...(selectedActor.fields || [])];
    updated[index] = { ...updated[index], ...patch };
    updateActor(selectedActor.id, { fields: updated });
  };

  const handleDeleteField = (index: number) => {
    if (!selectedActor) return;
    const updated = (selectedActor.fields || []).filter((_, i) => i !== index);
    updateActor(selectedActor.id, { fields: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-fw-panel border border-fw-border rounded-lg shadow-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden text-fw-text animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fw-border bg-fw-bg/40">
          <div className="flex items-center gap-2">
            <Users className="text-fw-accent" size={18} />
            <h2 className="text-sm font-semibold">Actors & Characters (DS4U)</h2>
            <span className="text-xs text-fw-muted">
              ({actors.length} {actors.length === 1 ? "actor" : "actors"})
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
          {/* Left: Actors List */}
          <div className="w-64 border-r border-fw-border flex flex-col bg-fw-panel/60">
            <div className="p-2 border-b border-fw-border flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fw-muted"
                />
                <input
                  type="text"
                  placeholder="Search actors…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-fw-bg border border-fw-border rounded pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-fw-accent"
                />
              </div>
              <button
                onClick={handleCreateActor}
                className="flex items-center justify-center p-1.5 bg-fw-accent text-white rounded hover:bg-blue-600 transition-colors"
                title="Add New Actor"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredActors.length === 0 ? (
                <div className="text-center py-8 text-xs text-fw-muted">
                  {search ? "No matching actors." : "No actors created yet."}
                </div>
              ) : (
                filteredActors.map((actor) => {
                  const isSelected = actor.id === selectedActorId;
                  return (
                    <div
                      key={actor.id}
                      onClick={() => setSelectedActorId(actor.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-fw-accent/20 border border-fw-accent text-white"
                          : "hover:bg-fw-bg/60 border border-transparent text-fw-text"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: actor.color || "#3b82f6" }}
                        >
                          {actor.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-xs truncate font-medium">
                          {actor.name}
                        </span>
                        {actor.isPlayer && (
                          <span className="text-[10px] px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-700/50 rounded shrink-0">
                            Player
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-fw-muted shrink-0 font-mono">
                        #{actor.externalId ?? "-"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Actor Editor */}
          <div className="flex-1 flex flex-col bg-fw-bg/30 overflow-y-auto p-5">
            {!selectedActor ? (
              <div className="flex-1 flex flex-col items-center justify-center text-fw-muted text-xs gap-2">
                <Users size={32} className="opacity-30" />
                <span>Select an actor or click "+" to add a new character.</span>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {/* Header row */}
                <div className="flex items-center justify-between pb-3 border-b border-fw-border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shadow"
                      style={{ backgroundColor: selectedActor.color || "#3b82f6" }}
                    >
                      {selectedActor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold leading-tight">
                        {selectedActor.name}
                      </h3>
                      <span className="text-[11px] text-fw-muted font-mono">
                        DS4U ID: {selectedActor.externalId ?? "Auto"} • UUID:{" "}
                        {selectedActor.id.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteActor(selectedActor.id, selectedActor.name)
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/40 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete Actor
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                      Actor Name
                    </label>
                    <input
                      type="text"
                      value={selectedActor.name}
                      onChange={(e) =>
                        updateActor(selectedActor.id, { name: e.target.value })
                      }
                      className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                      External ID (DS4U)
                    </label>
                    <input
                      type="number"
                      value={selectedActor.externalId ?? ""}
                      onChange={(e) =>
                        updateActor(selectedActor.id, {
                          externalId:
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent font-mono"
                    />
                  </div>
                </div>

                {/* Is Player & Color */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2 p-2.5 bg-fw-panel border border-fw-border rounded">
                    <input
                      type="checkbox"
                      id="isPlayerCheckbox"
                      checked={selectedActor.isPlayer}
                      onChange={(e) =>
                        updateActor(selectedActor.id, {
                          isPlayer: e.target.checked,
                          color: e.target.checked ? "#10b981" : selectedActor.color,
                        })
                      }
                      className="accent-emerald-500 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="isPlayerCheckbox"
                      className="text-xs cursor-pointer select-none font-medium flex items-center gap-1.5"
                    >
                      <Shield size={13} className="text-emerald-400" />
                      Is Player Character
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                      Node & Badge Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateActor(selectedActor.id, { color: c })}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            selectedActor.color === c
                              ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-fw-bg"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedActor.color || "#3b82f6"}
                        onChange={(e) =>
                          updateActor(selectedActor.id, { color: e.target.value })
                        }
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                        title="Custom Color"
                      />
                    </div>
                  </div>
                </div>

                {/* Portrait URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                    Portrait Asset / Sprite URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Assets/Portraits/Hero.png or https://…"
                    value={selectedActor.portrait || ""}
                    onChange={(e) =>
                      updateActor(selectedActor.id, {
                        portrait: e.target.value.trim() || null,
                      })
                    }
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent font-mono"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
                    Description / Biography
                  </label>
                  <textarea
                    rows={3}
                    value={selectedActor.description}
                    onChange={(e) =>
                      updateActor(selectedActor.id, { description: e.target.value })
                    }
                    placeholder="Write background information or notes for this character…"
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 text-xs text-fw-text focus:outline-none focus:border-fw-accent resize-none"
                  />
                </div>

                {/* Custom User Fields (DS4U Parity) */}
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

                  {(!selectedActor.fields || selectedActor.fields.length === 0) ? (
                    <div className="text-[11px] text-fw-muted py-2 italic bg-fw-panel/40 px-3 rounded border border-dashed border-fw-border">
                      No custom fields defined. Click "Add Field" to add arbitrary DS4U actor attributes (e.g. Age, Affection, Faction).
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedActor.fields.map((f, idx) => (
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
