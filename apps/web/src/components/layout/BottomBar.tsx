import React from "react";
import { useProjectStore } from "../../stores/projectStore";

export function BottomBar() {
  const { validationResult, lastSaved, saveStatus } = useProjectStore();
  const APP_VERSION = "0.1.0";

  const validationLabel = () => {
    if (!validationResult) return null;
    const { valid, errors, warnings } = validationResult;
    if (valid && warnings.length === 0) return { text: "✓ Valid", color: "text-fw-success" };
    if (!valid) return { text: `✗ ${errors.length} error${errors.length !== 1 ? "s" : ""}`, color: "text-fw-error" };
    return { text: `⚠ ${warnings.length} warning${warnings.length !== 1 ? "s" : ""}`, color: "text-fw-warning" };
  };

  const vl = validationLabel();

  return (
    <div className="h-7 bg-fw-panel border-t border-fw-border flex items-center px-3 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        {vl ? (
          <span className={`text-xs ${vl.color}`}>{vl.text}</span>
        ) : (
          <span className="text-xs text-fw-muted/50">—</span>
        )}
      </div>

      <div className="flex-1" />

      {lastSaved && (
        <span className="text-xs text-fw-muted/70">
          Last saved {lastSaved.toLocaleTimeString()}
        </span>
      )}
      {saveStatus === "failed" && (
        <span className="text-xs text-fw-error">Save failed</span>
      )}

      <span className="text-xs text-fw-muted/50">Freewrite {APP_VERSION}</span>
    </div>
  );
}
