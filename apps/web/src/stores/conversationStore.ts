import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  AnyDialogueNode,
  Connection,
  Conversation,
} from "@freewrite/core";
import { useProjectStore } from "./projectStore";
import { useDocumentStore } from "./documentStore";
import { collaborationManager } from "../features/collaboration/collaborationManager";

interface ConversationStoreState {
  activeConversationId: string | null;
  selectedNodeId: string | null;

  openConversation: (id: string) => void;
  closeConversation: () => void;
  setSelectedNodeId: (id: string | null) => void;

  createConversation: (title: string) => string;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;

  addNode: (type: AnyDialogueNode["type"], position: { x: number; y: number }) => string;
  updateNode: (nodeId: string, patch: Partial<AnyDialogueNode>) => void;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;

  addConnection: (sourceNodeId: string, targetNodeId: string) => void;
  removeConnection: (connectionId: string) => void;
  setStartNode: (nodeId: string | null) => void;
}

function createDefaultNode(
  type: AnyDialogueNode["type"],
  position: { x: number; y: number }
): AnyDialogueNode {
  const id = uuidv4();
  const base = { id, position, metadata: {} };

  switch (type) {
    case "start":
      return { ...base, type: "start", label: "Start" };
    case "dialogue":
      return {
        ...base,
        type: "dialogue",
        speakerId: null,
        conversantId: null,
        menuText: "",
        dialogueText: "Enter dialogue here...",
        conditions: [],
        actions: [],
        conditionsString: "",
        script: "",
        sequence: "",
        falseConditionAction: "Block",
        priority: "Normal",
        fields: [],
      };
    case "player_response":
      return {
        ...base,
        type: "player_response",
        speakerId: null,
        conversantId: null,
        responseText: "Option text...",
        menuText: "",
        conditions: [],
        actions: [],
        conditionsString: "",
        script: "",
        sequence: "",
        falseConditionAction: "Block",
        priority: "Normal",
        fields: [],
      };
    case "condition":
      return {
        ...base,
        type: "condition",
        expression: "variable == true",
      };
    case "action":
      return {
        ...base,
        type: "action",
        actionType: "set_variable",
        parameters: {},
      };
    case "end":
      return { ...base, type: "end", label: "End" };
    case "comment":
      return { ...base, type: "comment", text: "Note / comment..." };
  }
}

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  activeConversationId: null,
  selectedNodeId: null,

  openConversation: (id) => {
    set({ activeConversationId: id, selectedNodeId: null });
    useDocumentStore.getState().setViewMode("canvas");
    collaborationManager.updatePresence({
      activeConversationId: id,
      selectedNodeId: null,
    });
  },

  closeConversation: () => {
    set({ activeConversationId: null, selectedNodeId: null });
    collaborationManager.updatePresence({
      activeConversationId: null,
      selectedNodeId: null,
    });
  },

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
    const { activeConversationId } = get();
    collaborationManager.updatePresence({
      activeConversationId,
      selectedNodeId: id,
    });
  },

  createConversation: (title) => {
    const id = uuidv4();
    const newConv: Conversation = {
      id,
      title: title.trim() || "New Conversation",
      description: "",
      actorId: null,
      conversantId: null,
      priority: "Normal",
      startNodeId: null,
      nodes: [],
      connections: [],
      fields: [],
      metadata: {},
    };

    useProjectStore.getState().addConversation(newConv);
    set({ activeConversationId: id, selectedNodeId: null });

    const updatedProject = useProjectStore.getState().project;
    if (updatedProject) {
      collaborationManager.syncFullProject(updatedProject);
    }
    collaborationManager.updatePresence({
      activeConversationId: id,
      selectedNodeId: null,
    });

    return id;
  },

  renameConversation: (id, title) => {
    useProjectStore.getState().updateConversation(id, { title });
    const updatedProject = useProjectStore.getState().project;
    if (updatedProject) {
      collaborationManager.syncFullProject(updatedProject);
    }
  },

  deleteConversation: (id) => {
    const { activeConversationId } = get();
    useProjectStore.getState().removeConversation(id);
    if (activeConversationId === id) {
      set({ activeConversationId: null, selectedNodeId: null });
      collaborationManager.updatePresence({
        activeConversationId: null,
        selectedNodeId: null,
      });
    }
    const updatedProject = useProjectStore.getState().project;
    if (updatedProject) {
      collaborationManager.syncFullProject(updatedProject);
    }
  },

  addNode: (type, position) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return "";

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return "";

    const newNode = createDefaultNode(type, position);
    const updatedNodes = [...conv.nodes, newNode];
    const patch: Partial<Conversation> = { nodes: updatedNodes };

    if (newNode.type === "start" && !conv.startNodeId) {
      patch.startNodeId = newNode.id;
    }

    useProjectStore.getState().updateConversation(activeConversationId, patch);
    set({ selectedNodeId: newNode.id });

    // Sync node to Y.Doc
    collaborationManager.syncNode(activeConversationId, newNode);
    collaborationManager.updatePresence({
      activeConversationId,
      selectedNodeId: newNode.id,
    });

    return newNode.id;
  },

  updateNode: (nodeId, patch) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    let targetNode: AnyDialogueNode | null = null;
    const updatedNodes = conv.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const updated = { ...node, ...patch } as AnyDialogueNode;
      targetNode = updated;
      return updated;
    });

    useProjectStore.getState().updateConversation(activeConversationId, {
      nodes: updatedNodes,
    });

    // Sync node to Y.Doc
    if (targetNode) {
      collaborationManager.syncNode(activeConversationId, targetNode);
    }
  },

  removeNode: (nodeId) => {
    const { activeConversationId, selectedNodeId } = get();
    if (!activeConversationId) return;

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const updatedNodes = conv.nodes.filter((node) => node.id !== nodeId);
    const updatedConns = conv.connections.filter(
      (conn) => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    );

    const patch: Partial<Conversation> = {
      nodes: updatedNodes,
      connections: updatedConns,
    };

    if (conv.startNodeId === nodeId) {
      const nextStart = updatedNodes.find((n) => n.type === "start");
      patch.startNodeId = nextStart ? nextStart.id : null;
    }

    useProjectStore.getState().updateConversation(activeConversationId, patch);

    if (selectedNodeId === nodeId) {
      set({ selectedNodeId: null });
      collaborationManager.updatePresence({
        activeConversationId,
        selectedNodeId: null,
      });
    }

    // Sync removal to Y.Doc
    collaborationManager.removeNode(activeConversationId, nodeId);
  },

  moveNode: (nodeId, position) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    let targetNode: AnyDialogueNode | null = null;
    const updatedNodes = conv.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const updated = { ...node, position };
      targetNode = updated;
      return updated;
    });

    useProjectStore.getState().updateConversation(activeConversationId, {
      nodes: updatedNodes,
    });

    // Sync position to Y.Doc
    if (targetNode) {
      collaborationManager.syncNode(activeConversationId, targetNode);
    }
  },

  addConnection: (sourceNodeId, targetNodeId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const exists = conv.connections.some(
      (c) => c.sourceNodeId === sourceNodeId && c.targetNodeId === targetNodeId
    );
    if (exists) return;

    const newConn: Connection = {
      id: uuidv4(),
      sourceNodeId,
      targetNodeId,
      priority: 0,
      conditions: [],
      metadata: {},
    };

    useProjectStore.getState().updateConversation(activeConversationId, {
      connections: [...conv.connections, newConn],
    });

    // Sync connection to Y.Doc
    collaborationManager.syncConnection(activeConversationId, newConn);
  },

  removeConnection: (connectionId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    const project = useProjectStore.getState().project;
    const conv = project?.conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const updatedConns = conv.connections.filter((c) => c.id !== connectionId);
    useProjectStore.getState().updateConversation(activeConversationId, {
      connections: updatedConns,
    });

    // Sync removal to Y.Doc
    collaborationManager.removeConnection(activeConversationId, connectionId);
  },

  setStartNode: (nodeId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;
    useProjectStore.getState().updateConversation(activeConversationId, {
      startNodeId: nodeId,
    });
    const updatedProject = useProjectStore.getState().project;
    if (updatedProject) {
      collaborationManager.syncFullProject(updatedProject);
    }
  },
}));
