import React, { useState } from "react";
import { X, MapPin } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useLocationStore } from "../../stores/locationStore";

interface NewLocationDialogProps {
  onClose: () => void;
}

export function NewLocationDialog({ onClose }: NewLocationDialogProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const project = useProjectStore((s) => s.project);
  const createLocation = useLocationStore((s) => s.createLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createLocation(name, parentId || null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-96 bg-fw-panel border border-fw-border rounded shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-fw-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-fw-text uppercase tracking-wider">
            <MapPin size={14} className="text-emerald-400" />
            <span>New Location</span>
          </div>
          <button
            onClick={onClose}
            className="text-fw-muted hover:text-fw-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="block text-fw-muted mb-1">Location Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Valley, The Tavern, Harbor District..."
              className="w-full bg-fw-bg border border-fw-border rounded px-2.5 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            />
          </div>

          <div>
            <label className="block text-fw-muted mb-1">
              Parent Location (Optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-fw-bg border border-fw-border rounded px-2.5 py-1.5 text-fw-text focus:outline-none focus:border-fw-accent"
            >
              <option value="">(Top-Level Region / World)</option>
              {(project?.locations || []).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-fw-border text-fw-muted hover:text-fw-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Create Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
