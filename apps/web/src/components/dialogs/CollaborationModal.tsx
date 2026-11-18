import React, { useState, useEffect } from "react";
import {
  collaborationManager,
  type ConnectionState,
  type Collaborator,
} from "../../features/collaboration/collaborationManager";
import { useProjectStore } from "../../stores/projectStore";
import { Users, Wifi, WifiOff, X, Globe, User, Radio } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function CollaborationModal({ onClose }: Props) {
  const project = useProjectStore((s) => s.project);

  const [status, setStatus] = useState<ConnectionState>(collaborationManager.status);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(
    collaborationManager.collaborators
  );
  const [userName, setUserName] = useState(collaborationManager.getLocalUser().name);
  const [roomName, setRoomName] = useState(
    collaborationManager.roomId || project?.project.name?.replace(/\s+/g, "-").toLowerCase() || "my-project"
  );
  const [serverUrl, setServerUrl] = useState("ws://localhost:1234");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const unsubStatus = collaborationManager.onStatusChange(setStatus);
    const unsubCollab = collaborationManager.onCollaboratorsChange(setCollaborators);
    return () => {
      unsubStatus();
      unsubCollab();
    };
  }, []);

  const handleNameChange = (val: string) => {
    setUserName(val);
    collaborationManager.setLocalUserName(val);
  };

  const handleToggleConnect = async () => {
    setIsBusy(true);
    try {
      if (status === "connected" || status === "connecting") {
        collaborationManager.disconnect();
      } else {
        await collaborationManager.connect(roomName.trim(), serverUrl.trim());
      }
    } finally {
      setIsBusy(false);
    }
  };

  const localUser = collaborationManager.getLocalUser();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 select-none">
      <div className="bg-fw-panel border border-fw-border rounded w-full max-w-lg shadow-2xl flex flex-col text-xs text-fw-text overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fw-border">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-fw-accent" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Real-Time Collaboration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fw-muted hover:text-fw-text rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-3 rounded border flex items-center justify-between ${
              status === "connected"
                ? "bg-green-950/20 border-green-500/40 text-green-300"
                : status === "connecting"
                ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                : "bg-fw-bg border-fw-border text-fw-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              {status === "connected" ? (
                <Wifi size={16} className="text-green-400" />
              ) : status === "connecting" ? (
                <Radio size={16} className="text-amber-400 animate-pulse" />
              ) : (
                <WifiOff size={16} className="text-fw-muted" />
              )}
              <div>
                <div className="font-semibold capitalize">
                  {status === "connected"
                    ? "Connected to Collaboration Room"
                    : status === "connecting"
                    ? "Connecting to Server..."
                    : "Local Mode (Offline)"}
                </div>
                {status === "connected" && (
                  <div className="text-[10px] text-fw-muted mt-0.5">
                    Room: <span className="font-mono text-fw-text">{collaborationManager.roomId}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleToggleConnect}
              disabled={isBusy}
              className={`px-3 py-1.5 rounded font-medium text-xs transition-colors shadow-sm ${
                status === "connected"
                  ? "bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/50"
                  : "bg-fw-accent hover:bg-fw-accent-hover text-white"
              }`}
            >
              {status === "connected" ? "Disconnect" : "Connect"}
            </button>
          </div>

          {/* User Profile */}
          <div className="bg-fw-bg p-3 rounded border border-fw-border/80 space-y-2">
            <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider block">
              Your Collaborator Profile
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                style={{ backgroundColor: localUser.color }}
              >
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Your Display Name"
                className="flex-1 bg-fw-panel border border-fw-border rounded px-2.5 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              />
            </div>
          </div>

          {/* Connection Settings */}
          {status !== "connected" && (
            <div className="bg-fw-bg p-3 rounded border border-fw-border/80 space-y-3">
              <span className="text-[11px] font-semibold text-fw-muted uppercase tracking-wider block">
                Session Settings
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-fw-muted block mb-1">Collaboration Room</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. game-script-alpha"
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
                  />
                </div>
                <div>
                  <label className="text-fw-muted block mb-1">Hocuspocus WebSocket Server</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="ws://localhost:1234"
                    className="w-full bg-fw-panel border border-fw-border rounded px-2.5 py-1 text-fw-text focus:outline-none focus:border-fw-accent font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Online Peers List */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-fw-muted uppercase tracking-wider mb-1">
              <span>Online Collaborators ({collaborators.length})</span>
            </div>

            {status !== "connected" ? (
              <div className="text-center py-4 text-fw-muted/60 text-[11px]">
                Connect to see other active collaborators on this project.
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-4 text-fw-muted/60 text-[11px]">
                You are currently the only editor in this room. Open another browser tab or share the room name to collaborate!
              </div>
            ) : (
              <div className="divide-y divide-fw-border/60 border border-fw-border rounded overflow-hidden">
                {collaborators.map((c) => (
                  <div
                    key={c.clientId}
                    className="p-2.5 bg-fw-bg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-fw-text">{c.name}</div>
                        {c.activeConversationId && (
                          <div className="text-[10px] text-fw-muted">
                            Editing active graph
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">
                      Active
                    </span>
                  </div>
                ))}
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
