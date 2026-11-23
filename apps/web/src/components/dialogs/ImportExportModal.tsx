import React, { useState } from "react";
import {
  exportProjectToDialogueSystemCSV,
  importProjectFromDialogueSystemCSV,
  exportProjectToChatMapperXML,
  importProjectFromChatMapperXML,
  validateProject,
  type Project,
} from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";
import { downloadProjectFile } from "../../features/storage/fileSystemAccess";
import {
  FileText,
  FileCode,
  Download,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  FolderArchive,
} from "lucide-react";

interface Props {
  onClose: () => void;
  defaultTab?: "import" | "export";
}

export function ImportExportModal({ onClose, defaultTab = "export" }: Props) {
  const { project } = useProjectStore();
  const [tab, setTab] = useState<"import" | "export">(defaultTab);

  // Import preview state
  const [importedPreview, setImportedPreview] = useState<{
    project: Project;
    warnings: string[];
    sourceType: "CSV" | "XML";
  } | null>(null);
  const [importError, setImportError] = useState("");

  const handleExportCSV = () => {
    if (!project) return;
    const csv = exportProjectToDialogueSystemCSV(project);
    const fileName = `${project.project.name.replace(/\s+/g, "_")}_DS4U.csv`;
    downloadProjectFile(csv, fileName);
  };

  const handleExportXML = () => {
    if (!project) return;
    const xml = exportProjectToChatMapperXML(project);
    const fileName = `${project.project.name.replace(/\s+/g, "_")}_ChatMapper.xml`;
    downloadProjectFile(xml, fileName);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    const isXml = file.name.endsWith(".xml");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (isXml) {
          const res = importProjectFromChatMapperXML(text);
          setImportedPreview({
            project: res.project,
            warnings: res.warnings,
            sourceType: "XML",
          });
        } else {
          const res = importProjectFromDialogueSystemCSV(text);
          setImportedPreview({
            project: res.project,
            warnings: res.warnings,
            sourceType: "CSV",
          });
        }
      } catch (err) {
        setImportError(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importedPreview) return;
    // Set project in Zustand store
    useProjectStore.setState({
      project: importedPreview.project,
      isDirty: false,
      saveStatus: "saved",
      lastSaved: new Date(),
    });
    useProjectStore.getState().revalidate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 select-none">
      <div className="bg-fw-panel border border-fw-border rounded w-full max-w-xl shadow-2xl flex flex-col text-xs text-fw-text overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fw-border">
          <div className="flex items-center gap-2">
            <FolderArchive size={16} className="text-fw-accent" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Dialogue System for Unity Integration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fw-muted hover:text-fw-text rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-fw-border bg-fw-bg/40 px-4">
          <button
            onClick={() => setTab("export")}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors ${
              tab === "export"
                ? "border-fw-accent text-fw-accent"
                : "border-transparent text-fw-muted hover:text-fw-text"
            }`}
          >
            Export to DS4U
          </button>
          <button
            onClick={() => setTab("import")}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors ${
              tab === "import"
                ? "border-fw-accent text-fw-accent"
                : "border-transparent text-fw-muted hover:text-fw-text"
            }`}
          >
            Import from DS4U
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4">
          {tab === "export" ? (
            <div className="space-y-4">
              <p className="text-fw-muted text-[11px] leading-relaxed">
                Export your Freewrite project into Pixel Crushers' official interchange formats.
                Preserves actors, branching dialogue graphs, conditions, sequences, and canvas coordinates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CSV Export Card */}
                <div className="p-3 bg-fw-bg rounded border border-fw-border flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-fw-text mb-1">
                      <FileText size={15} className="text-green-400" />
                      <span>Dialogue System CSV</span>
                    </div>
                    <p className="text-[10px] text-fw-muted leading-relaxed">
                      Official section-based CSV format. Import into Unity via{" "}
                      <span className="font-mono text-fw-text">
                        Tools → Pixel Crushers → Dialogue System → Import → CSV
                      </span>.
                    </p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    disabled={!project}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-fw-accent hover:bg-fw-accent-hover text-white rounded font-medium text-xs transition-colors"
                  >
                    <Download size={13} />
                    <span>Download .CSV</span>
                  </button>
                </div>

                {/* XML Export Card */}
                <div className="p-3 bg-fw-bg rounded border border-fw-border flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-fw-text mb-1">
                      <FileCode size={15} className="text-blue-400" />
                      <span>Chat Mapper XML</span>
                    </div>
                    <p className="text-[10px] text-fw-muted leading-relaxed">
                      Standard Chat Mapper XML format. Import into Unity via{" "}
                      <span className="font-mono text-fw-text">
                        Tools → Pixel Crushers → Dialogue System → Import → Chat Mapper
                      </span>.
                    </p>
                  </div>

                  <button
                    onClick={handleExportXML}
                    disabled={!project}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-fw-panel hover:bg-fw-bg border border-fw-border hover:border-fw-text text-fw-text rounded font-medium text-xs transition-colors"
                  >
                    <Download size={13} />
                    <span>Download .XML</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Import Tab */
            <div className="space-y-4">
              <p className="text-fw-muted text-[11px] leading-relaxed">
                Import an existing dialogue database from Unity (CSV or Chat Mapper XML).
                The dialogue graphs, actors, and variables will be reconstructed with node canvas layout preserved.
              </p>

              {!importedPreview ? (
                <div>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-fw-border hover:border-fw-accent rounded cursor-pointer bg-fw-bg transition-colors group">
                    <Upload size={22} className="text-fw-muted group-hover:text-fw-accent mb-2" />
                    <span className="text-xs font-medium text-fw-text mb-0.5">
                      Click to choose or drop a .csv or .xml file
                    </span>
                    <span className="text-[10px] text-fw-muted">
                      Pixel Crushers CSV or Chat Mapper XML
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {importError && (
                    <div className="mt-2 p-2 bg-red-950/30 border border-red-800/40 text-red-300 rounded text-xs flex items-center gap-1.5">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-fw-bg p-3 rounded border border-fw-border space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-fw-border/70">
                    <div className="flex items-center gap-1.5 text-green-400 font-semibold">
                      <CheckCircle size={15} />
                      <span>Ready to Import ({importedPreview.sourceType})</span>
                    </div>
                    <button
                      onClick={() => setImportedPreview(null)}
                      className="text-xs text-fw-muted hover:text-fw-text"
                    >
                      Choose another file
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-fw-muted">Project Name:</span>
                      <span className="font-semibold text-fw-text">
                        {importedPreview.project.project.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fw-muted">Actors:</span>
                      <span className="text-fw-text">
                        {importedPreview.project.actors.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fw-muted">Conversations:</span>
                      <span className="text-fw-text">
                        {importedPreview.project.conversations.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fw-muted">Dialogue Nodes:</span>
                      <span className="text-fw-text">
                        {importedPreview.project.conversations.reduce(
                          (acc, c) => acc + c.nodes.length,
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fw-muted">Connections:</span>
                      <span className="text-fw-text">
                        {importedPreview.project.conversations.reduce(
                          (acc, c) => acc + c.connections.length,
                          0
                        )}
                      </span>
                    </div>
                  </div>

                  {importedPreview.warnings.length > 0 && (
                    <div className="p-2 bg-amber-950/20 border border-amber-800/40 text-amber-300 rounded text-[10px]">
                      {importedPreview.warnings.join(", ")}
                    </div>
                  )}

                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium text-xs transition-colors shadow"
                  >
                    Confirm & Load into Editor
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-2.5 border-t border-fw-border bg-fw-panel">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-fw-panel border border-fw-border hover:border-fw-text text-fw-text rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
