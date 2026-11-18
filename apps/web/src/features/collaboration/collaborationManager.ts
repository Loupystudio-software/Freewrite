import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  initYDocFromProject,
  extractProjectFromYDoc,
  syncNodeToYDoc,
  removeNodeFromYDoc,
  syncConnectionToYDoc,
  removeConnectionFromYDoc,
  type Project,
  type AnyDialogueNode,
  type Connection,
} from "@freewrite/core";
import { useProjectStore } from "../../stores/projectStore";

export interface Collaborator {
  clientId: number;
  name: string;
  color: string;
  activeConversationId?: string | null;
  selectedNodeId?: string | null;
}

export type ConnectionState = "disconnected" | "connecting" | "connected";

const COLOR_PALETTE = [
  "#4f8ef7", // blue
  "#34d399", // emerald
  "#f472b6", // pink
  "#fbbf24", // amber
  "#a78bfa", // purple
  "#38bdf8", // sky
  "#fb7185", // rose
  "#2dd4bf", // teal
];

class CollaborationManager {
  private doc: Y.Doc | null = null;
  private provider: HocuspocusProvider | null = null;
  private isApplyingRemoteUpdate = false;

  private localUser = {
    name:
      localStorage.getItem("fw_collab_name") ||
      `Writer-${Math.floor(Math.random() * 900 + 100)}`,
    color:
      localStorage.getItem("fw_collab_color") ||
      COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
  };

  public status: ConnectionState = "disconnected";
  public collaborators: Collaborator[] = [];
  public roomId: string | null = null;

  private statusListeners = new Set<(status: ConnectionState) => void>();
  private collaboratorListeners = new Set<(collaborators: Collaborator[]) => void>();

  public onStatusChange(listener: (status: ConnectionState) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public onCollaboratorsChange(listener: (collabs: Collaborator[]) => void): () => void {
    this.collaboratorListeners.add(listener);
    listener(this.collaborators);
    return () => this.collaboratorListeners.delete(listener);
  }

  public getLocalUser() {
    return this.localUser;
  }

  public setLocalUserName(name: string) {
    this.localUser.name = name.trim() || this.localUser.name;
    localStorage.setItem("fw_collab_name", this.localUser.name);
    if (this.provider) {
      this.provider.awareness?.setLocalStateField("user", this.localUser);
    }
  }

  public async connect(
    roomName: string,
    serverUrl = "ws://localhost:1234"
  ): Promise<void> {
    if (this.provider) {
      this.disconnect();
    }

    this.roomId = roomName;
    this.updateStatus("connecting");

    const doc = new Y.Doc();
    this.doc = doc;

    const provider = new HocuspocusProvider({
      url: serverUrl,
      name: roomName,
      document: doc,
      onStatus: ({ status }) => {
        this.updateStatus(status);
      },
      onSynced: () => {
        const project = useProjectStore.getState().project;
        const convsMap = doc.getMap("conversations");

        // If remote doc is fresh/empty but we have a local project open, initialize remote doc
        if (convsMap.size === 0 && project) {
          initYDocFromProject(project, doc);
        } else if (convsMap.size > 0) {
          // Sync from remote doc into local store
          this.applyRemoteDocToStore();
        }
      },
    });

    this.provider = provider;

    // Set local awareness state
    provider.awareness?.setLocalStateField("user", this.localUser);

    // Listen to remote awareness changes
    provider.awareness?.on("change", () => {
      this.updateCollaborators();
    });

    // Listen to Y.Doc changes
    doc.on("update", (_update: Uint8Array, origin: unknown) => {
      // If this client initiated the transaction locally, ignore to avoid re-triggering store
      if (origin === "local_client") return;
      this.applyRemoteDocToStore();
    });
  }

  public disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.roomId = null;
    this.collaborators = [];
    this.updateStatus("disconnected");
    this.notifyCollaborators();
  }

  public updatePresence(info: {
    activeConversationId?: string | null;
    selectedNodeId?: string | null;
  }): void {
    if (this.provider?.awareness) {
      const currentState = this.provider.awareness.getLocalState() || {};
      this.provider.awareness.setLocalState({
        ...currentState,
        user: this.localUser,
        ...info,
      });
    }
  }

  // --- Document Outgoing Mutation Hooks ---

  public syncNode(conversationId: string, node: AnyDialogueNode): void {
    if (!this.doc || this.isApplyingRemoteUpdate) return;
    syncNodeToYDoc(this.doc, conversationId, node);
  }

  public removeNode(conversationId: string, nodeId: string): void {
    if (!this.doc || this.isApplyingRemoteUpdate) return;
    removeNodeFromYDoc(this.doc, conversationId, nodeId);
  }

  public syncConnection(conversationId: string, connection: Connection): void {
    if (!this.doc || this.isApplyingRemoteUpdate) return;
    syncConnectionToYDoc(this.doc, conversationId, connection);
  }

  public removeConnection(conversationId: string, connectionId: string): void {
    if (!this.doc || this.isApplyingRemoteUpdate) return;
    removeConnectionFromYDoc(this.doc, conversationId, connectionId);
  }

  public syncFullProject(project: Project): void {
    if (!this.doc || this.isApplyingRemoteUpdate) return;
    initYDocFromProject(project, this.doc);
  }

  // --- Internal Updates ---

  private applyRemoteDocToStore(): void {
    if (!this.doc) return;
    try {
      this.isApplyingRemoteUpdate = true;
      const remoteProject = extractProjectFromYDoc(this.doc);
      if (remoteProject.conversations.length > 0 || remoteProject.project.name) {
        // Direct set into Zustand store
        useProjectStore.setState({
          project: remoteProject,
          isDirty: false,
          saveStatus: "saved",
        });
        useProjectStore.getState().revalidate();
      }
    } finally {
      this.isApplyingRemoteUpdate = false;
    }
  }

  private updateStatus(status: ConnectionState): void {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private updateCollaborators(): void {
    if (!this.provider?.awareness) return;

    const states = this.provider.awareness.getStates();
    const collabs: Collaborator[] = [];
    const localClientId = this.provider.awareness.clientID;

    states.forEach((state, clientID) => {
      // Don't include local user in remote collaborators list
      if (clientID === localClientId) return;

      const user = state.user as { name?: string; color?: string } | undefined;
      if (user) {
        collabs.push({
          clientId: clientID,
          name: user.name || `User-${clientID}`,
          color: user.color || "#4f8ef7",
          activeConversationId: state.activeConversationId,
          selectedNodeId: state.selectedNodeId,
        });
      }
    });

    this.collaborators = collabs;
    this.notifyCollaborators();
  }

  private notifyCollaborators(): void {
    this.collaboratorListeners.forEach((l) => l(this.collaborators));
  }
}

export const collaborationManager = new CollaborationManager();
