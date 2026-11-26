import React from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import type {
  CustomField,
  Location,
  LocationElement,
  LocationLinkedEntityType,
  Project,
} from "@freewrite/core";
import { useLocationStore } from "../../stores/locationStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useDocumentStore } from "../../stores/documentStore";

interface LocationInspectorProps {
  location: Location;
  selectedElement?: LocationElement;
  project: Project;
}

export function LocationInspector({
  location,
  selectedElement,
  project,
}: LocationInspectorProps) {
  const { updateLocation, updateElement, removeElement, openLocation } =
    useLocationStore();
  const { openConversation } = useConversationStore();
  const { openDocument, setViewMode } = useDocumentStore();

  if (selectedElement) {
    const el = selectedElement;
    const handleJumpToLinked = () => {
      if (!el.linkedEntityId) return;
      if (el.linkedEntityType === "location") openLocation(el.linkedEntityId);
      else if (el.linkedEntityType === "conversation") {
        openConversation(el.linkedEntityId);
        setViewMode("canvas");
      } else if (el.linkedEntityType === "document") {
        openDocument(el.linkedEntityId);
      }
    };

    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-fw-border">
          <div>
            <span className="text-[10px] uppercase font-bold text-fw-muted tracking-wider">
              Location Element
            </span>
            <div className="text-sm font-semibold text-white capitalize">
              {el.type.replace("_", " ")}
            </div>
          </div>
          <button
            onClick={() => removeElement(location.id, el.id)}
            className="p-1 text-fw-muted hover:text-fw-error"
            title="Delete Element"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Name</label>
          <input
            value={el.name}
            onChange={(e) =>
              updateElement(location.id, el.id, { name: e.target.value })
            }
            className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
          />
        </div>

        <div>
          <label className="text-fw-muted block mb-1">Description / Notes</label>
          <textarea
            rows={3}
            value={el.description}
            onChange={(e) =>
              updateElement(location.id, el.id, { description: e.target.value })
            }
            className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent resize-none"
            placeholder="Level design notes, lore, encounter triggers..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-fw-muted block mb-1">Color</label>
            <input
              type="color"
              value={el.color}
              onChange={(e) =>
                updateElement(location.id, el.id, { color: e.target.value })
              }
              className="w-full h-7 bg-fw-bg border border-fw-border rounded-sm cursor-pointer"
            />
          </div>
          <div>
            <label className="text-fw-muted block mb-1">
              Opacity ({Math.round(el.opacity * 100)}%)
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={el.opacity}
              onChange={(e) =>
                updateElement(location.id, el.id, {
                  opacity: Number(e.target.value),
                })
              }
              className="w-full mt-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={el.visible}
              onChange={(e) =>
                updateElement(location.id, el.id, { visible: e.target.checked })
              }
            />
            <span>Visible</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={el.locked}
              onChange={(e) =>
                updateElement(location.id, el.id, { locked: e.target.checked })
              }
            />
            <span>Locked</span>
          </label>
        </div>

        <hr className="border-fw-border" />

        {/* World Entity / Flow Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-fw-muted font-semibold uppercase text-[10px] tracking-wider">
              Linked World Entity
            </label>
            {el.linkedEntityId &&
              (el.linkedEntityType === "location" ||
                el.linkedEntityType === "conversation" ||
                el.linkedEntityType === "document") && (
                <button
                  onClick={handleJumpToLinked}
                  className="flex items-center gap-1 text-[11px] text-fw-accent hover:underline"
                >
                  <ExternalLink size={11} /> Open
                </button>
              )}
          </div>

          <select
            value={el.linkedEntityType}
            onChange={(e) =>
              updateElement(location.id, el.id, {
                linkedEntityType: e.target.value as LocationLinkedEntityType,
                linkedEntityId: null,
              })
            }
            className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none"
          >
            <option value="none">(None)</option>
            <option value="location">Location (Portal / Sub-Area)</option>
            <option value="conversation">Conversation (Flow)</option>
            <option value="actor">Actor / NPC</option>
            <option value="item">Quest / Item</option>
            <option value="document">Narrative Document</option>
          </select>

          {el.linkedEntityType !== "none" && (
            <select
              value={el.linkedEntityId || ""}
              onChange={(e) =>
                updateElement(location.id, el.id, {
                  linkedEntityId: e.target.value || null,
                })
              }
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none"
            >
              <option value="">-- Select Target --</option>
              {el.linkedEntityType === "location" &&
                (project.locations || [])
                  .filter((l) => l.id !== location.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              {el.linkedEntityType === "conversation" &&
                project.conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              {el.linkedEntityType === "actor" &&
                project.actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              {el.linkedEntityType === "item" &&
                (project.items || []).map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              {el.linkedEntityType === "document" &&
                (project.documents || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  // Location Properties (when no element is selected)
  const handleAddField = () => {
    const nextFields: CustomField[] = [
      ...(location.fields || []),
      { title: "New Field", type: "Text", value: "" },
    ];
    updateLocation(location.id, { fields: nextFields });
  };

  const handleUpdateField = (idx: number, patch: Partial<CustomField>) => {
    const nextFields = (location.fields || []).map((f, i) =>
      i === idx ? { ...f, ...patch } : f
    );
    updateLocation(location.id, { fields: nextFields });
  };

  const handleRemoveField = (idx: number) => {
    const nextFields = (location.fields || []).filter((_, i) => i !== idx);
    updateLocation(location.id, { fields: nextFields });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <div>
        <label className="text-fw-muted block mb-1">Location Name</label>
        <input
          value={location.name}
          onChange={(e) =>
            updateLocation(location.id, { name: e.target.value })
          }
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
        />
      </div>

      <div>
        <label className="text-fw-muted block mb-1">Parent Location</label>
        <select
          value={location.parentId || ""}
          onChange={(e) =>
            updateLocation(location.id, { parentId: e.target.value || null })
          }
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
        >
          <option value="">(Top-Level Region / World)</option>
          {(project.locations || [])
            .filter((l) => l.id !== location.id)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="text-fw-muted block mb-1">Description</label>
        <textarea
          rows={3}
          value={location.description}
          onChange={(e) =>
            updateLocation(location.id, { description: e.target.value })
          }
          className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent resize-none"
          placeholder="Atmosphere, quest relevance, level design summary..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-fw-muted block mb-1">Marker Color</label>
          <input
            type="color"
            value={location.color}
            onChange={(e) =>
              updateLocation(location.id, { color: e.target.value })
            }
            className="w-full h-7 bg-fw-bg border border-fw-border rounded-sm cursor-pointer"
          />
        </div>
        <div>
          <label className="text-fw-muted block mb-1">Canvas Background</label>
          <input
            type="color"
            value={location.backgroundColor}
            onChange={(e) =>
              updateLocation(location.id, { backgroundColor: e.target.value })
            }
            className="w-full h-7 bg-fw-bg border border-fw-border rounded-sm cursor-pointer"
          />
        </div>
      </div>

      <div className="text-[11px] flex justify-between pt-1">
        <span className="text-fw-muted">Map Elements:</span>
        <span className="text-fw-text">{location.elements.length}</span>
      </div>

      <hr className="border-fw-border" />

      {/* Custom Fields */}
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
          {(location.fields || []).map((field, idx) => (
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
