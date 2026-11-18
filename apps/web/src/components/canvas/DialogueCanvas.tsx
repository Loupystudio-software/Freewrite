import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection as RFConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { AnyDialogueNode, Connection, Conversation } from "@freewrite/core";
import { useConversationStore } from "../../stores/conversationStore";
import { nodeTypes } from "./nodes";
import { NodeToolbar } from "./NodeToolbar";
import { CanvasContextMenu } from "./CanvasContextMenu";

interface DialogueCanvasProps {
  conversation: Conversation;
}

function coreNodesToRF(
  nodes: AnyDialogueNode[],
  selectedNodeId: string | null
): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: { coreNode: node },
    selected: node.id === selectedNodeId,
  }));
}

function coreConnectionsToRF(connections: Connection[]): Edge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceNodeId,
    target: conn.targetNodeId,
    type: "smoothstep",
    style: { stroke: "#4f8ef7", strokeWidth: 1.8 },
    animated: false,
  }));
}

function CanvasInner({ conversation }: DialogueCanvasProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    moveNode,
    removeNode,
    addConnection,
    removeConnection,
  } = useConversationStore();

  const { screenToFlowPosition, fitView } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowPos: { x: number; y: number };
  } | null>(null);

  const initialNodes = useMemo(
    () => coreNodesToRF(conversation.nodes, selectedNodeId),
    [conversation.nodes, selectedNodeId]
  );

  const initialEdges = useMemo(
    () => coreConnectionsToRF(conversation.connections),
    [conversation.connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize when conversation data updates externally
  useEffect(() => {
    setNodes(coreNodesToRF(conversation.nodes, selectedNodeId));
  }, [conversation.nodes, selectedNodeId, setNodes]);

  useEffect(() => {
    setEdges(coreConnectionsToRF(conversation.connections));
  }, [conversation.connections, setEdges]);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      moveNode(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      });
    },
    [moveNode]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      for (const n of deletedNodes) {
        removeNode(n.id);
      }
    },
    [removeNode]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const e of deletedEdges) {
        removeConnection(e.id);
      }
    },
    [removeConnection]
  );

  const onConnect = useCallback(
    (connection: RFConnection) => {
      if (connection.source && connection.target) {
        addConnection(connection.source, connection.target);
      }
    },
    [addConnection]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setContextMenu(null);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId]);

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPos,
      });
    },
    [screenToFlowPosition]
  );

  const handleAddNodeFromToolbar = useCallback(
    (type: AnyDialogueNode["type"]) => {
      const centerPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      addNode(type, { x: Math.round(centerPos.x), y: Math.round(centerPos.y) });
    },
    [addNode, screenToFlowPosition]
  );

  const handleAddNodeFromContext = useCallback(
    (type: AnyDialogueNode["type"]) => {
      if (contextMenu) {
        addNode(type, {
          x: Math.round(contextMenu.flowPos.x),
          y: Math.round(contextMenu.flowPos.y),
        });
      }
    },
    [addNode, contextMenu]
  );

  return (
    <div className="w-full h-full relative" onContextMenu={(e) => e.preventDefault()}>
      <NodeToolbar onAddNode={handleAddNodeFromToolbar} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[#1a1a1a]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#333333" />
        <Controls className="!bg-[#1f1f1f] !border-fw-border !fill-fw-text !shadow-md" />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case "start":
                return "#4ade80";
              case "dialogue":
                return "#4f8ef7";
              case "player_response":
                return "#a78bfa";
              case "condition":
                return "#fbbf24";
              case "action":
                return "#f87171";
              case "end":
                return "#ef4444";
              default:
                return "#666666";
            }
          }}
          className="!bg-[#1f1f1f] !border-fw-border"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddNode={handleAddNodeFromContext}
          onFitView={() => fitView({ duration: 300 })}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export function DialogueCanvas({ conversation }: DialogueCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner conversation={conversation} />
    </ReactFlowProvider>
  );
}
