import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Variable } from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";
import { Plus, Trash2, X, Sliders, Check } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function VariablesModal({ onClose }: Props) {
  const { project, addVariable, updateVariable, removeVariable } = useProjectStore();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"boolean" | "number" | "string">("boolean");
  const [newVal, setNewVal] = useState<boolean | number | string>(false);
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");

  const handleTypeChange = (type: "boolean" | "number" | "string") => {
    setNewType(type);
    if (type === "boolean") setNewVal(false);
    else if (type === "number") setNewVal(0);
    else setNewVal("");
  };

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Variable name is required.");
      return;
    }

    if (project?.variables.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A variable with this name already exists.");
      return;
    }

    const newVar: Variable = {
      id: uuidv4(),
      name: trimmed,
      type: newType,
      initialValue: newVal,
      description: newDesc.trim(),
    };

    addVariable(newVar);
    setNewName("");
    setNewDesc("");
    handleTypeChange(newType);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-fw-panel border border-fw-border rounded w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-xs text-fw-text select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fw-border">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-fw-accent" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Project Variables
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fw-muted hover:text-fw-text rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add Variable Bar */}
          <div className="bg-fw-bg p-3 rounded border border-fw-border/80 space-y-3">
            <div className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider">
              Create New Variable
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="col-span-1 md:col-span-2">
                <input
                  type="text"
                  placeholder="Variable name (e.g. HasMetMira, Coins)"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 focus:outline-none focus:border-fw-accent text-fw-text"
                />
              </div>

              <div>
                <select
                  value={newType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as "boolean" | "number" | "string")
                  }
                  className="w-full bg-fw-panel border border-fw-border rounded px-2 py-1.5 focus:outline-none focus:border-fw-accent text-fw-text"
                >
                  <option value="boolean">Boolean</option>
                  <option value="number">Number</option>
                  <option value="string">String</option>
                </select>
              </div>

              <div>
                {newType === "boolean" ? (
                  <select
                    value={String(newVal)}
                    onChange={(e) => setNewVal(e.target.value === "true")}
                    className="w-full bg-fw-panel border border-fw-border rounded px-2 py-1.5 focus:outline-none focus:border-fw-accent text-fw-text"
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : newType === "number" ? (
                  <input
                    type="number"
                    value={Number(newVal)}
                    onChange={(e) => setNewVal(Number(e.target.value))}
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 focus:outline-none focus:border-fw-accent text-fw-text"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Default value"
                    value={String(newVal)}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1.5 focus:outline-none focus:border-fw-accent text-fw-text"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Optional description..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="flex-1 bg-fw-panel border border-fw-border rounded px-2.5 py-1 focus:outline-none focus:border-fw-accent text-fw-text text-[11px]"
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-3 py-1 bg-fw-accent text-white rounded hover:bg-fw-accent-hover transition-colors font-medium text-xs"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            {error && <div className="text-xs text-fw-error">{error}</div>}
          </div>

          {/* Variables Table */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-2">
              Active Variables ({project?.variables.length || 0})
            </div>

            {!project?.variables.length ? (
              <div className="text-center py-8 text-fw-muted/60">
                No variables created yet. Use the form above to add variables for conditional branching.
              </div>
            ) : (
              <div className="border border-fw-border rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-fw-bg border-b border-fw-border text-fw-muted text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Initial Value</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fw-border/60">
                    {project.variables.map((v) => (
                      <tr key={v.id} className="hover:bg-fw-bg/50 transition-colors">
                        <td className="py-2 px-3 font-mono font-medium text-fw-text">
                          {v.name}
                        </td>
                        <td className="py-2 px-3 text-fw-muted">
                          <span className="px-1.5 py-0.5 rounded bg-fw-bg border border-fw-border text-[10px]">
                            {v.type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {v.type === "boolean" ? (
                            <button
                              onClick={() =>
                                updateVariable(v.id, { initialValue: !v.initialValue })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                                v.initialValue
                                  ? "bg-green-500/20 text-green-400 border-green-500/40"
                                  : "bg-red-500/20 text-red-400 border-red-500/40"
                              }`}
                            >
                              {String(v.initialValue)}
                            </button>
                          ) : v.type === "number" ? (
                            <input
                              type="number"
                              value={Number(v.initialValue)}
                              onChange={(e) =>
                                updateVariable(v.id, { initialValue: Number(e.target.value) })
                              }
                              className="w-20 bg-fw-bg border border-fw-border rounded px-1.5 py-0.5 text-[11px] font-mono text-fw-text"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(v.initialValue)}
                              onChange={(e) =>
                                updateVariable(v.id, { initialValue: e.target.value })
                              }
                              className="w-32 bg-fw-bg border border-fw-border rounded px-1.5 py-0.5 text-[11px] text-fw-text"
                            />
                          )}
                        </td>
                        <td className="py-2 px-3 text-fw-muted/80 truncate max-w-[180px]">
                          {v.description || "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => removeVariable(v.id)}
                            className="p-1 text-fw-muted hover:text-fw-error rounded transition-colors"
                            title="Delete Variable"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-2.5 border-t border-fw-border bg-fw-panel">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-fw-accent text-white rounded text-xs hover:bg-fw-accent-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
